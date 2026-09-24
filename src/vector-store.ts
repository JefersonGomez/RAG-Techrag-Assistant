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

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const vector = vectors[j];
      // PostgreSQL espera el vector en formato string: '[0.1, 0.2, 0.3]'
      // JavaScript nos da un array: [0.1, 0.2, 0.3]
      const vectorStr = `[${vector.join(",")}]`;

      // Usamos $executeRaw porque Prisma no soporta el tipo 'vector' nativamente aún.
      // ::jsonb y ::vector son casts de PostgreSQL para decirle al DB
      // "trata este string como JSON" y "trata este string como vector".

      await prisma.$executeRaw` INSERT INTO document_chunks (id, content, metadata, embedding)
        VALUES (
          gen_random_uuid(),
          ${chunk.content},
          ${JSON.stringify(chunk.metadata)}::jsonb,
          ${vectorStr}::vector
        )
      `;

      stored++;
    }

    console.log(`✅ Progreso: ${stored}/${chunks.length}`);
  }
}
