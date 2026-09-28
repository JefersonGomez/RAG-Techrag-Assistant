// src/routes/ingest-repo.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {simpleGit} from 'simple-git';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { processDirectory } from '../ingestion';
import { storeChuncks } from '../vector-store';
import { prisma } from '../db';

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

    const cleanRepoUrl = repoUrl.replace(/\.git$/, '');
    
    // 1. Verificar última ingesta
    const lastIngestion = await prisma.repoIngestion.findUnique({
      where: { repoUrl: cleanRepoUrl }
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techrag-'));
    let newChunks = 0;
    let deletedChunks = 0;
    let isFullClone = false;

    try {
      if (!lastIngestion) {
        // PRIMERA VEZ: Clonado completo
        console.log(`📥 Primera ingesta: clonando ${cleanRepoUrl}...`);
        await simpleGit().clone(cleanRepoUrl, tempDir, [
          '--branch', branch, '--single-branch', '--depth', '1'
        ]);
        isFullClone = true;

        const chunks = await processDirectory(tempDir, {
          repoUrl: cleanRepoUrl, branch, ingestedAt: new Date().toISOString()
        });

        if (chunks.length > 0) {
          await storeChuncks(chunks);
          newChunks = chunks.length;
        }

        // Obtener HEAD commit
        const git = simpleGit(tempDir);
        const log = await git.log({ maxCount: 1 });
        const latestCommit = log.latest?.hash || 'unknown';

        await prisma.repoIngestion.upsert({
          where: { repoUrl: cleanRepoUrl },
          update: { lastCommit: latestCommit, chunksCount: newChunks, branch },
          create: { repoUrl: cleanRepoUrl, branch, lastCommit: latestCommit, chunksCount: newChunks }
        });

      } else {
        // INCREMENTAL: Clonar + diff contra último commit
        console.log(`🔄 Ingestión incremental desde commit ${lastIngestion.lastCommit}...`);
        await simpleGit().clone(cleanRepoUrl, tempDir, [
          '--branch', branch, '--single-branch'
        ]);

        const git = simpleGit(tempDir);
        
        // Obtener lista de archivos cambiados desde último commit
        const diffSummary = await git.diffSummary([`${lastIngestion.lastCommit}..HEAD`]);
        
        if (diffSummary.files.length === 0) {
          console.log('ℹ️ No hay cambios desde la última ingesta');
          return res.json({ 
            message: 'Sin cambios detectados', 
            repoUrl: cleanRepoUrl, 
            branch, 
            newChunks: 0, 
            deletedChunks: 0 
          });
        }

        console.log(` ${diffSummary.files.length} archivos modificados`);

        // Procesar SOLO archivos modificados o añadidos
        const modifiedFiles = diffSummary.files.filter(f => f.file && !f.file.startsWith('node_modules/'));
        
        for (const file of modifiedFiles) {
          const filePath = path.join(tempDir, file.file);
          const ext = path.extname(file.file).toLowerCase();
          
          if (['.js', '.ts', '.md', '.txt'].includes(ext)) {
            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const type = ['.js', '.ts'].includes(ext) ? 'code' : 'doc';
              
              const chunks = await processDirectory(
                path.dirname(filePath), // Hack: pasar directorio padre para que readDir encuentre el archivo
                { repoUrl: cleanRepoUrl, branch, ingestedAt: new Date().toISOString() }
              );
              
              // Filtrar solo chunks de ESTE archivo específico
              const relevantChunks = chunks.filter(c => c.metadata.source.includes(file.file));
              
              if (relevantChunks.length > 0) {
                await storeChuncks(relevantChunks);
                newChunks += relevantChunks.length;
              }
            } catch (err) {
              console.warn(`⚠️ Error procesando ${file.file}:`, err);
            }
          }
        }

        // Actualizar tracking
        const log = await git.log({ maxCount: 1 });
        const latestCommit = log.latest?.hash || 'unknown';

        await prisma.repoIngestion.update({
          where: { repoUrl: cleanRepoUrl },
          data: { lastCommit: latestCommit, chunksCount: { increment: newChunks - deletedChunks } }
        });
      }

      res.json({ 
        message: isFullClone ? 'Repositorio indexado completamente' : 'Ingestión incremental completada',
        repoUrl: cleanRepoUrl, 
        branch, 
        newChunks, 
        deletedChunks,
        isFullClone 
      });

    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(' Carpeta temporal eliminada');
    }

  } catch (error) {
    console.error('Error en ingest-repo:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno' });
  }
});

export default router;