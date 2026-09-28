// scripts/test-ingestion-flow.ts
import { simpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const REPO_URL =
  process.env.TEST_REPO_URL ||
  'https://github.com/JefersonGomez/RAG-Techrag-Assistant.git';
const BRANCH = process.env.TEST_BRANCH || 'main';
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callApi(endpoint: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    throw new Error(`${endpoint} falló (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('🧪 INICIANDO PRUEBA E2E DE INGESTIÓN INCREMENTAL\n');

  let tempDir: string | undefined;

  try {
    // PASO 1: primera ingesta (clonado completo)
    console.log('📥 PASO 1: Primera ingesta...');
    const first = await callApi('/api/ingest-repo', { repoUrl: REPO_URL, branch: BRANCH });
    console.log(`   ✅ Resultado: ${first.message}`);
    console.log(`   📊 Chunks nuevos: ${first.newChunks}, Full clone: ${first.isFullClone}`);

    if (!first.isFullClone || !(first.newChunks > 0)) {
      throw new Error('La primera ingesta debería ser full clone con chunks > 0');
    }

    // PASO 2: clonar localmente, modificar y hacer push
    console.log('\n✏️  PASO 2: Preparando modificación local...');
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'techrag-test-'));

    await simpleGit().clone(REPO_URL, tempDir, [
      '--branch', BRANCH,
      '--single-branch',
      '--depth', '1',
    ]);

    const git = simpleGit(tempDir);
    // Identidad local, solo para este repo temporal
    await git.addConfig('user.name', 'Ingestion Test Bot');
    await git.addConfig('user.email', 'ingestion-test@example.com');

    const fileName = 'TEST_INGESTION.md';
    const timestamp = new Date().toISOString();
    await fs.writeFile(
      path.join(tempDir, fileName),
      `# Prueba de Ingestión Incremental\n\nGenerado automáticamente en: ${timestamp}\n\nEste archivo verifica que el diff funciona.\n`
    );

    await git.add(fileName);
    await git.commit('chore: add ingestion test file [skip ci]');
    await git.push('origin', BRANCH);
    console.log(`   ✅ Archivo modificado y pusheado: ${fileName}`);

    // El push es síncrono; esta pausa corta es solo por prudencia
    await sleep(2000);

    // PASO 3: segunda ingesta (debería ser incremental)
    console.log('\n🔄 PASO 3: Segunda ingesta (incremental)...');
    const second = await callApi('/api/ingest-repo', { repoUrl: REPO_URL, branch: BRANCH });
    console.log(`   ✅ Resultado: ${second.message}`);
    console.log(`   📊 Chunks nuevos: ${second.newChunks}, Full clone: ${second.isFullClone}`);

    if (second.isFullClone) {
      throw new Error('La segunda ingesta NO debería ser full clone');
    }
    if (!(second.newChunks > 0)) {
      throw new Error('Debería haber detectado chunks nuevos del archivo modificado');
    }

    console.log('\n🎉 TODAS LAS PRUEBAS PASARON');
    console.log('   - Primera ingesta: clonado completo ✅');
    console.log('   - Detección de cambios vía Git Diff ✅');
    console.log('   - Ingestión incremental funcional ✅');
  } catch (error) {
    console.error('\n❌ PRUEBA FALLIDA:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      console.log('\n🧹 Carpeta temporal limpiada');
    }
  }
}

main();