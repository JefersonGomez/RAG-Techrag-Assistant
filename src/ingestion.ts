// src/ingestion.ts (Sprint 4: Con soporte para customMetadata + Citas por Líneas)
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    type: 'code' | 'doc';
    language?: string;
    startLine?: number;   // ← NUEVO: Línea inicial del chunk
    endLine?: number;     // ← NUEVO: Línea final del chunk
    [key: string]: string | number | undefined; // ← Permitir metadatos dinámicos adicionales
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
  customMetadata?: Record<string, string>
): Promise<DocumentChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 509,
    chunkOverlap: 50,
  });

  const baseMetadata = {
    source: filePath,
    type,
    language: ext.replace('.', ''),
    ...customMetadata
  };

  const docs = await splitter.createDocuments([content], [baseMetadata]);

  // Cálculo aproximado de líneas basado en densidad de caracteres del archivo original
  const lines = content.split('\n');
  const totalChars = content.length;
  const avgCharsPerLine = totalChars / Math.max(lines.length, 1);

  return docs.map((doc, index) => {
    // Estimación de posición basada en el índice del chunk y el tamaño efectivo (chunk - overlap)
    const effectiveChunkSize = 509 - 50; 
    const chunkStartPos = index * effectiveChunkSize;
    const chunkEndPos = chunkStartPos + doc.pageContent.length;
    
    const startLine = Math.min(Math.floor(chunkStartPos / avgCharsPerLine) + 1, lines.length);
    const endLine = Math.min(Math.floor(chunkEndPos / avgCharsPerLine) + 1, lines.length);

    return {
      content: doc.pageContent,
      metadata: {
        ...doc.metadata,
        startLine,
        endLine,
      } as any,
    };
  });
}