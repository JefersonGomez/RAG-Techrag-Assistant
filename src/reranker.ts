// src/reranker.ts
import { InferenceClient } from '@huggingface/inference';
import type { RetrievedChunk } from './retriver';

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export interface RerankedChunk extends RetrievedChunk {
  rerankScore: number; // Score del cross-encoder (0-1, mayor = más relevante)
}

/**
 * Re-ordena chunks usando cross-encoder bge-reranker-v2-m3.
 * @param query - La pregunta original
 * @param candidates - Chunks candidatos del retrieval inicial (recomendado: 15-20)
 * @param topK - Número final de chunks a retornar (default: 4)
 */
export async function rerankChunks(
  query: string,
  candidates: RetrievedChunk[],
  topK: number = 4
): Promise<RerankedChunk[]> {
  
  if (candidates.length === 0) return [];

  console.log(`🔄 Re-ranking ${candidates.length} candidatos...`);

  // Evaluamos cada candidato con el reranker
  const scoredCandidates = await Promise.all(
    candidates.map(async (chunk) => {
      try {
        // En HF Inference API, se pasa la consulta y el texto a comparar
        const output = await hf.textClassification({
          model: 'BAAI/bge-reranker-v2-m3',
          inputs: `${query} [SEP] ${chunk.content}`,
        });

        // El modelo devuelve un array con los scores por etiqueta/clase
        // Para los rerankers, tomamos la puntuación del resultado principal (o de la clase 'LABEL_0' / la más alta)
        const score = Array.isArray(output) && output.length > 0 ? output[0].score : 0;

        return {
          ...chunk,
          rerankScore: score,
        };
      } catch (error) {
       console.error(`Error procesando chunk (${chunk.metadata?.source || 'desconocido'}):`, error);
        return {
          ...chunk,
          rerankScore: 0,
        };
      }
    })
  );

  // Ordenar por rerankScore descendente y tomar topK
  const reranked = scoredCandidates
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);

  console.log(`✅ Top-${topK} tras re-ranking:`);
  reranked.forEach((c, i) => 
    console.log(`   [${i + 1}] Rerank: ${c.rerankScore.toFixed(4)} | Cosine: ${c.score.toFixed(3)} | ${c.metadata.source}`)
  );

  return reranked;
}