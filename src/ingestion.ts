// src/ingestion.ts (Sprint 4: Con soporte para customMetadata + Citas por Líneas)
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export const SUPPORTED_EXTS = ['.js', '.ts', '.md', '.txt'];

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;       // Ruta relativa a la raíz del repo, con '/' (ej: "src/db.ts")
    type: 'code' | 'doc';
    language?: string;
    startLine?: number;   // ← Línea inicial del chunk
    endLine?: number;     // ← Línea final del chunk
    [key: string]: string | number | undefined; // ← Permitir metadatos dinámicos adicionales
  };
}

// Mismo criterio que processDirectory, para rutas de git (con '/'): ignora carpetas ocultas y node_modules
export function isIndexable(file: string): boolean {
  const dirs = file.split('/').slice(0, -1);
  return SUPPORTED_EXTS.includes(path.extname(file).toLowerCase())
    && !dirs.some(d => d.startsWith('.') || d === 'node_modules');
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 509,
  chunkOverlap: 50,
});

export async function processDirectory(
  dirPath: string,
  customMetadata?: Record<string, string>
): Promise<DocumentChunk[]> {
  const chunks: DocumentChunk[] = [];

  async function readDir(currentPath: string) {
    try {
      const files = await fs.readdir(currentPath);

      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules') {
            await readDir(filePath);
          }
        } else if (SUPPORTED_EXTS.includes(path.extname(file).toLowerCase())) {
          const relPath = path.relative(dirPath, filePath).split(path.sep).join('/');
          chunks.push(...await processFile(dirPath, relPath, customMetadata));
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error leyendo directorio ${currentPath}:`, error);
    }
  }

  await readDir(dirPath);
  return chunks;
}

/** Procesa un solo archivo. relPath usa '/' y es relativo a rootDir. */
export async function processFile(
  rootDir: string,
  relPath: string,
  customMetadata?: Record<string, string>
): Promise<DocumentChunk[]> {
  const ext = path.extname(relPath).toLowerCase();
  const content = await fs.readFile(path.join(rootDir, relPath), 'utf-8');
  const type = ['.js', '.ts'].includes(ext) ? 'code' : 'doc';

  const baseMetadata = {
    source: relPath,
    type,
    language: ext.replace('.', ''),
    ...customMetadata
  };

  const docs = await splitter.createDocuments([content], [baseMetadata]);

  // LangChain calcula las líneas reales de cada chunk en metadata.loc.lines
  return docs.map((doc) => {
    const { loc, ...metadata } = doc.metadata;
    return {
      content: doc.pageContent,
      metadata: {
        ...metadata,
        startLine: loc?.lines?.from,
        endLine: loc?.lines?.to,
      } as DocumentChunk['metadata'],
    };
  });
}
