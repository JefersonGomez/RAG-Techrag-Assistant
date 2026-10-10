import { Prisma } from "../generated/prisma";
import { prisma } from "./db";
import { embeddings } from "./embeddings";
import { DocumentChunk } from "./ingestion";

export async function storeChuncks(chunks: DocumentChunk[]) {
  console.log(`🔄 Procesando ${chunks.length} fragmentos...`);

  // ¿Por qué procesar en lotes (batches)?
  // La API gratuita de HuggingFace tiene límites de velocidad (rate limits).
  // Si enviamos 1000 chunks de golpe, nos bloquearán.
  // 5 es un número seguro para la capa gratuita.

  const BATCH_SIZE = 5;
  let stored = 0;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const vectors = await embeddings.embedDocuments(
      batch.map((c) => c.content),
    );

    // PostgreSQL espera el vector en formato string: '[0.1, 0.2, 0.3]'
    // ::jsonb y ::vector son casts de PostgreSQL para decirle al DB
    // "trata este string como JSON" y "trata este string como vector".
    // Usamos $executeRaw porque Prisma no soporta el tipo 'vector' nativamente aún.
    const rows = batch.map((chunk, j) => Prisma.sql`(
      gen_random_uuid(),
      ${chunk.content},
      ${JSON.stringify(chunk.metadata)}::jsonb,
      ${`[${vectors[j].join(",")}]`}::vector
    )`);

    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, content, metadata, embedding)
      VALUES ${Prisma.join(rows)}
    `;

    stored += batch.length;
    console.log(`✅ Progreso: ${stored}/${chunks.length}`);
  }
}

/** Borra los chunks de un repo (todos, o solo los de ciertos archivos). Devuelve cuántos borró. */
export async function deleteChunks(repoUrl: string, sources?: string[]): Promise<number> {
  if (sources && sources.length === 0) return 0;
  return prisma.$executeRaw`
    DELETE FROM document_chunks
    WHERE metadata->>'repoUrl' = ${repoUrl}
    ${sources ? Prisma.sql`AND metadata->>'source' IN (${Prisma.join(sources)})` : Prisma.empty}
  `;
}
