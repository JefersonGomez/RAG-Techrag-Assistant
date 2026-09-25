// src/retriever.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "./db";
import { embeddings } from "./embeddings";

export interface RetrievedChunk {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 4,
  filters?: Record<string, string>
): Promise<RetrievedChunk[]> {
  
  const queryVector = await embeddings.embedQuery(query);
  const vectorStr = `[${queryVector.join(",")}]`;

  // Construimos la cláusula WHERE usando la clase Prisma.raw o Prisma.empty
  let whereFragment = Prisma.empty;

  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .map(([key, value]) => `metadata->>'${key}' = '${value}'`)
      .join(" AND ");
    
    whereFragment = Prisma.raw(`WHERE ${conditions}`);
  }

  // ✅ FÓRMULA CORRECTA PARA SIMILITUD COSENO EN PGVECTOR
  // Usamos <#> (producto punto negativo) que equivale a similitud coseno
  // cuando los vectores están normalizados (BGE-M3 los normaliza por defecto)
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT 
      content,
      metadata,
      (embedding <#> ${vectorStr}::vector) * -1 as score
    FROM document_chunks
    ${whereFragment}
    ORDER BY embedding <#> ${vectorStr}::vector
    LIMIT ${topK}
  `;

  return results;
}