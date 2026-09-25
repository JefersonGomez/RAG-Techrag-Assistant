// src/routes/ingest-repo.ts
import { Router } from "express";
import simpleGit from "simple-git";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";
import { processDirectory } from "../ingestion";
import { storeChuncks } from "../vector-store";

const router = Router();

router.post("/api/ingest-repo", async (req, res) => {
  let tempDir: string | undefined;
  try {
    const { repoUrl, branch = 'main' } = req.body || {};

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'Se requiere repoUrl válido en el body como JSON' });
    }
    if (!repoUrl.startsWith("http://") && !repoUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Solo se soportan URLs HTTP/HTTPS" });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "techrag-"));
    console.log(`📥 Clonando ${repoUrl} (${branch}) en ${tempDir}...`);

    await simpleGit().clone(repoUrl, tempDir, ["--branch", branch, "--single-branch", "--depth", "1"]);

    console.log("🔍 Procesando chunks...");
    const chunks = await processDirectory(tempDir, {
      repoUrl: repoUrl.replace(/\.git$/, ""),
      branch,
      ingestedAt: new Date().toISOString(),
    });

    if (chunks.length === 0) {
      return res.status(404).json({ error: "No se encontraron archivos válidos (.ts,.js,.md,.txt)" });
    }

    console.log(`💾 Guardando ${chunks.length} chunks en Supabase...`);
    await storeChuncks(chunks);

    res.json({
      message: "Repositorio indexado exitosamente",
      repoUrl,
      branch,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error("Error en ingest-repo:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Error interno",
    });
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      console.log("🧹 Carpeta temporal eliminada");
    }
  }
});
export default router;
