// src/reranker.ts
// Cross-encoder local bge-reranker-v2-m3 (ONNX): puntúa cada par (pregunta, chunk) en una sola pasada.
import {
  AutoTokenizer,
  AutoModelForSequenceClassification,
  type PreTrainedTokenizer,
  type PreTrainedModel,
} from '@huggingface/transformers';
import { sessionOptions } from './embeddings';
import type { RetrievedChunk } from './retriver';

const MODEL = 'onnx-community/bge-reranker-v2-m3-ONNX';

export interface RerankedChunk extends RetrievedChunk {
  rerankScore: number; // Score del cross-encoder (0-1, mayor = más relevante)
}

let loaded: Promise<[PreTrainedTokenizer, PreTrainedModel]> | null = null;
function getReranker() {
  return (loaded ??= Promise.all([
    AutoTokenizer.from_pretrained(MODEL),
    AutoModelForSequenceClassification.from_pretrained(MODEL, {
      dtype: 'q8',
      session_options: sessionOptions,
    }),
  ]).catch((err) => {
    loaded = null; // Si falla (p. ej. red en la descarga), reintentar en la próxima llamada
    throw err;
  }));
}

export const warmupReranker = () => getReranker().then(() => undefined);

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

  let scores: number[];
  try {
    const [tokenizer, model] = await getReranker();
    // Pregunta y chunk como par real de entrada (no concatenados con "[SEP]")
    const inputs = tokenizer(new Array(candidates.length).fill(query), {
      text_pair: candidates.map((c) => c.content),
      padding: true,
      truncation: true,
    });
    const { logits } = await model(inputs);
    // Un logit por par; sigmoid lo lleva a 0-1
    scores = (logits.sigmoid().tolist() as number[][]).map(([s]) => s);
  } catch (error) {
    // Si el reranker falla, nos quedamos con el orden de la búsqueda vectorial
    console.error('Error en re-ranking, usando orden por coseno:', error);
    return candidates.slice(0, topK).map((c) => ({ ...c, rerankScore: c.score }));
  }

  // Ordenar por rerankScore descendente y tomar topK
  const reranked = candidates
    .map((chunk, i) => ({ ...chunk, rerankScore: scores[i] }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);

  console.log(`✅ Top-${topK} tras re-ranking:`);
  reranked.forEach((c, i) =>
    console.log(`   [${i + 1}] Rerank: ${c.rerankScore.toFixed(4)} | Cosine: ${c.score.toFixed(3)} | ${c.metadata.source}`)
  );

  return reranked;
}
