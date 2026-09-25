// src/retriever.ts
import { prisma } from "./db";
import { embeddings } from "./embeddings";
import { Prisma } from "../generated/prisma"; // <-- import correcto

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

  let whereClause = "";
  if (filters && Object.keys(filters).length > 0) {
    const conditions = Object.entries(filters)
      .map(([key, value]) => `metadata->>'${key}' = '${value}'`)
      .join(" AND ");
    whereClause = `WHERE ${conditions}`;
  }

  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT 
      content,
      metadata,
      1 - (embedding <-> ${vectorStr}::vector) as score
    FROM document_chunks
    ${whereClause ? Prisma.raw(whereClause) : Prisma.empty}
    ORDER BY embedding <-> ${vectorStr}::vector
    LIMIT ${topK}
  `;

  return results;
}