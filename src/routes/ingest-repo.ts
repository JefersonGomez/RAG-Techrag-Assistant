// src/routes/ingest-repo.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { simpleGit } from 'simple-git';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { processDirectory, processFile, isIndexable } from '../ingestion';
import { storeChuncks, deleteChunks } from '../vector-store';
import { invalidateCache } from '../cache';
import { prisma } from '../db';
import { requireAdmin } from '../auth';

const router = Router();

const ingestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: 'Límite de ingestión alcanzado. Espera 5 minutos.' },
});

// Solo repos públicos de GitHub por HTTPS (evita file://, ssh, IPs internas...)
const REPO_URL_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
// Nombre de rama seguro: sin espacios, sin '..', sin empezar por '-' (inyección de flags)
const BRANCH_RE = /^(?!-)(?!.*\.\.)[\w./-]{1,100}$/;

// ponytail: lock en memoria, solo vale con una instancia; usar lock en DB/Redis si se escala
const inProgress = new Set<string>();

router.post('/api/ingest-repo', requireAdmin, ingestLimiter, async (req, res) => {
  const { repoUrl, branch = 'main', full = false } = req.body || {};
  if (typeof repoUrl !== 'string' || typeof branch !== 'string') {
    return res.status(400).json({ error: 'Se requiere repoUrl válido' });
  }

  const cleanRepoUrl = repoUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');
  if (!REPO_URL_RE.test(cleanRepoUrl)) {
    return res.status(400).json({ error: 'repoUrl debe ser https://github.com/<owner>/<repo>' });
  }
  if (!BRANCH_RE.test(branch)) {
    return res.status(400).json({ error: 'Nombre de rama inválido' });
  }
  if (inProgress.has(cleanRepoUrl)) {
    return res.status(409).json({ error: 'Ya hay una ingesta en curso para este repo' });
  }

  inProgress.add(cleanRepoUrl);
  let tempDir: string | undefined;

  try {
    // 1. Verificar última ingesta
    const lastIngestion = await prisma.repoIngestion.findUnique({
      where: { repoUrl: cleanRepoUrl }
    });

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techrag-'));
    const metadata = { repoUrl: cleanRepoUrl, branch, ingestedAt: new Date().toISOString() };
    let newChunks = 0;
    let deletedChunks = 0;

    // Archivos cambiados desde el último commit, o null si hay que reindexar todo
    let changes: Array<{ status: string; file: string }> | null = null;

    // full: regrabar desde cero (p. ej. tras cambiar qué archivos se indexan)
    if (lastIngestion && lastIngestion.branch === branch && full !== true) {
      // INCREMENTAL: historial completo (sin blobs viejos) para poder hacer diff
      await simpleGit().clone(cleanRepoUrl, tempDir, [
        '--branch', branch, '--single-branch', '--filter=blob:none'
      ]);
      try {
        const diff = await simpleGit(tempDir).raw([
          'diff', '--name-status', '--no-renames', `${lastIngestion.lastCommit}..HEAD`
        ]);
        changes = diff.split('\n').filter(Boolean).map(line => {
          const [status, file] = line.split('\t');
          return { status, file };
        });
      } catch (err) {
        // Commit anterior desconocido (force-push, rebase...): reindexar todo
        console.warn(`⚠️ No se pudo hacer diff desde ${lastIngestion.lastCommit}, reindexando completo`);
      }
    } else {
      console.log(`📥 Ingesta completa: clonando ${cleanRepoUrl}...`);
      await simpleGit().clone(cleanRepoUrl, tempDir, [
        '--branch', branch, '--single-branch', '--depth', '1'
      ]);
    }

    if (changes === null) {
      // COMPLETA: borrar lo que hubiera de este repo y reindexar
      deletedChunks = await deleteChunks(cleanRepoUrl);
      const chunks = await processDirectory(tempDir, metadata);
      if (chunks.length > 0) await storeChuncks(chunks);
      newChunks = chunks.length;
    } else {
      const relevant = changes.filter(c => isIndexable(c.file));
      console.log(`🔄 Incremental desde ${lastIngestion!.lastCommit}: ${relevant.length} archivos relevantes cambiados`);

      // Los chunks viejos de archivos modificados o borrados se eliminan siempre
      deletedChunks = await deleteChunks(cleanRepoUrl, relevant.map(c => c.file));

      for (const { status, file } of relevant) {
        if (status === 'D') continue;
        try {
          const chunks = await processFile(tempDir, file, metadata);
          if (chunks.length > 0) await storeChuncks(chunks);
          newChunks += chunks.length;
        } catch (err) {
          console.warn(`⚠️ Error procesando ${file}:`, err);
        }
      }
    }

    // Actualizar tracking
    const log = await simpleGit(tempDir).log({ maxCount: 1 });
    const latestCommit = log.latest?.hash || 'unknown';
    const isFullClone = changes === null;

    await prisma.repoIngestion.upsert({
      where: { repoUrl: cleanRepoUrl },
      update: {
        lastCommit: latestCommit,
        branch,
        chunksCount: isFullClone ? newChunks : { increment: newChunks - deletedChunks },
      },
      create: { repoUrl: cleanRepoUrl, branch, lastCommit: latestCommit, chunksCount: newChunks },
    });

    if (newChunks > 0 || deletedChunks > 0) await invalidateCache();

    res.json({
      message: isFullClone
        ? 'Repositorio indexado completamente'
        : (newChunks || deletedChunks) ? 'Ingestión incremental completada' : 'Sin cambios detectados',
      repoUrl: cleanRepoUrl,
      branch,
      newChunks,
      deletedChunks,
      isFullClone,
    });

  } catch (error) {
    console.error('Error en ingest-repo:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno' });
  } finally {
    inProgress.delete(cleanRepoUrl);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('🧹 Carpeta temporal eliminada');
    }
  }
});

// Borra un repo indexado: sus chunks (Supabase) y su registro de ingesta
router.delete('/api/repos', requireAdmin, async (req, res) => {
  const repoUrl = req.query.repoUrl;
  if (typeof repoUrl !== 'string' || !REPO_URL_RE.test(repoUrl)) {
    return res.status(400).json({ error: 'repoUrl debe ser https://github.com/<owner>/<repo>' });
  }
  if (inProgress.has(repoUrl)) {
    return res.status(409).json({ error: 'Hay una ingesta en curso para este repo' });
  }
  try {
    const deletedChunks = await deleteChunks(repoUrl);
    const { count } = await prisma.repoIngestion.deleteMany({ where: { repoUrl } });
    if (count === 0 && deletedChunks === 0) return res.status(404).json({ error: 'Repo no encontrado' });
    await invalidateCache();
    res.json({ ok: true, deletedChunks });
  } catch (error) {
    console.error('Error borrando repo:', error);
    res.status(500).json({ error: 'No se pudo borrar el repo' });
  }
});

export default router;
