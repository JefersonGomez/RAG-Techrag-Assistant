// src/ingestion.ts (Versión Corregida - Con soporte para customMetadata)
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    type: 'code' | 'doc';
    language?: string;
    [key: string]: string | undefined; // ← Permitir metadatos dinámicos adicionales
  };
}

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
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.ts', '.md', '.txt'].includes(ext)) {
            const content = await fs.readFile(filePath, 'utf-8');
            const type = ['.js', '.ts'].includes(ext) ? 'code' : 'doc';

            // ← Pasar customMetadata a splitContent
            const fileChunks = await splitContent(content, filePath, type, ext, customMetadata);
            chunks.push(...fileChunks);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error leyendo directorio ${currentPath}:`, error);
    }
  }

  await readDir(dirPath);
  return chunks;
}

async function splitContent(
  content: string,
  filePath: string,
  type: 'code' | 'doc',
  ext: string,
  customMetadata?: Record<string, string> // ← Recibir customMetadata
): Promise<DocumentChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 509,
    chunkOverlap: 50,
  });

  // ← Fusionar metadatos base con customMetadata
  const baseMetadata = {
    source: filePath,
    type,
    language: ext.replace('.', ''),
    ...customMetadata // ← Los metadatos personalizados sobrescriben o complementan
  };

  const docs = await splitter.createDocuments([content], [baseMetadata]);

  return docs.map(doc => ({
    content: doc.pageContent,
    metadata: doc.metadata as any
  }));
}