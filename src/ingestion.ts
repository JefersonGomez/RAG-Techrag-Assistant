// src/ingestion.ts (Versión Nativa - Sin fs-extra)
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs/promises'; // Módulo nativo de Node.js para promesas
import * as path from 'path';

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    type: 'code' | 'doc';
    language?: string;
  };
}

export async function processDirectory(dirPath: string): Promise<DocumentChunk[]> {
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
            
            const fileChunks = await splitContent(content, filePath, type, ext);
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
  ext: string
): Promise<DocumentChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([content], [{ 
    source: filePath, 
    type,
    language: ext.replace('.', '')
  }]);

  return docs.map(doc => ({
    content: doc.pageContent,
    metadata: doc.metadata as any
  }));
}