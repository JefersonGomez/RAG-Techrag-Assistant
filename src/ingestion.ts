// src/ingestion.ts (Sprint 4: Con soporte para customMetadata + Citas por Líneas)
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export const SUPPORTED_EXTS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte',
  '.go', '.java', '.py', '.rb', '.php', '.cs', '.rs', '.kt', '.swift', '.c', '.cpp', '.h',
  '.html', '.css', '.scss', '.sql', '.prisma', '.sh',
  '.json', '.yml', '.yaml', '.toml',
  '.md', '.txt',
];
const DOC_EXTS = ['.md', '.txt'];
// Generados y enormes: solo meten ruido en la búsqueda
const SKIP_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'go.sum', 'composer.lock'];
// Carpetas ocultas que sí tienen contenido útil (CI/CD)
const ALLOWED_DOT_DIRS = ['.github'];

const skipDir = (d: string) =>
  d === 'node_modules' || (d.startsWith('.') && !ALLOWED_DOT_DIRS.includes(d));

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

// Criterio único para processDirectory y la ingesta incremental (rutas con '/')
export function isIndexable(file: string): boolean {
  const parts = file.split('/');
  const name = parts.pop()!;
  return SUPPORTED_EXTS.includes(path.extname(name).toLowerCase())
    && !SKIP_FILES.includes(name)
    && !parts.some(skipDir);
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
          if (!skipDir(file)) await readDir(filePath);
        } else {
          const relPath = path.relative(dirPath, filePath).split(path.sep).join('/');
          if (isIndexable(relPath)) chunks.push(...await processFile(dirPath, relPath, customMetadata));
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
  const type = DOC_EXTS.includes(ext) ? 'doc' : 'code';

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
