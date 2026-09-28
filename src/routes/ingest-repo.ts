// src/routes/ingest-repo.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { simpleGit } from 'simple-git';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { processDirectory } from '../ingestion';
import { storeChuncks } from '../vector-store';

const router = Router();

const ingestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: 'Límite de ingestión alcanzado. Espera 5 minutos.' },
});

router.post('/api/ingest-repo', ingestLimiter, async (req, res) => {
  try {
    const { repoUrl, branch = 'main' } = req.body || {};

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'Se requiere repoUrl válido' });
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techrag-'));
    
    console.log(`📥 Clonando ${repoUrl} (${branch})...`);
    await simpleGit().clone(repoUrl, tempDir, ['--branch', branch, '--single-branch', '--depth', '1']);

    const chunks = await processDirectory(tempDir, {
      repoUrl: repoUrl.replace(/\.git$/, ''),
      branch,
      ingestedAt: new Date().toISOString()
    });
    
    if (chunks.length === 0) {
      await fs.rm(tempDir, { recursive: true, force: true });
      return res.status(404).json({ error: 'No se encontraron archivos válidos' });
    }

    console.log(`💾 Guardando ${chunks.length} chunks...`);
    await storeChuncks(chunks);
    await fs.rm(tempDir, { recursive: true, force: true });

    res.json({ message: 'Repositorio indexado', repoUrl, branch, chunksCount: chunks.length });

  } catch (error) {
    console.error('Error en ingest-repo:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno' });
  }
});

export default router;