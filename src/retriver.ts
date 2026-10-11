// src/retriever.ts
import { Prisma } from "../generated/prisma";
import { prisma } from "./db";
import { embeddings } from "./embeddings";

export interface RetrievedChunk {
  id?: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

// Valida filtros que llegan del cliente: objeto plano de string -> string
export function parseFilters(input: unknown): Record<string, string> | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("filters debe ser un objeto { clave: valor }");
  }
  for (const [key, value] of Object.entries(input)) {
    if (!/^[A-Za-z0-9_]{1,64}$/.test(key) || typeof value !== "string") {
      throw new Error(`Filtro inválido: ${key}`);
    }
  }
  return input as Record<string, string>;
}

// Manifiestos en la raíz del repo: dicen con qué está hecho, pero casi nunca ganan por similitud
const MANIFESTS = ['package.json', 'go.mod', 'pom.xml', 'build.gradle', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'composer.json', 'Gemfile'];

export async function getManifestChunks(repoUrl: string): Promise<RetrievedChunk[]> {
  // Solo el primer trozo de cada manifiesto: ahí están nombre y dependencias
  return prisma.$queryRaw<RetrievedChunk[]>`
    SELECT DISTINCT ON (metadata->>'source') id, content, metadata, 0::float AS score
    FROM document_chunks
    WHERE metadata->>'repoUrl' = ${repoUrl}
      AND metadata->>'source' IN (${Prisma.join(MANIFESTS)})
    ORDER BY metadata->>'source', (metadata->>'startLine')::int
    LIMIT 3
  `;
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 4,
  filters?: Record<string, string>
): Promise<RetrievedChunk[]> {

  const queryVector = await embeddings.embedQuery(query);
  const vectorStr = `[${queryVector.join(",")}]`;

  // Clave y valor van como parámetros ($1, $2...), nunca concatenados al SQL
  const entries = Object.entries(filters ?? {});
  const whereFragment = entries.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(
        entries.map(([key, value]) => Prisma.sql`metadata->>${key} = ${value}`),
        " AND "
      )}`
    : Prisma.empty;

  // ✅ FÓRMULA CORRECTA PARA SIMILITUD COSENO EN PGVECTOR
  // Usamos <#> (producto punto negativo) que equivale a similitud coseno
  // cuando los vectores están normalizados (BGE-M3 los normaliza por defecto)
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT
      id,
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
