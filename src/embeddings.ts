// src/embeddings.ts
// Embeddings locales con transformers.js: el mismo BAAI/bge-m3 (1024 dims) en ONNX, sin API ni créditos.
import { pipeline, env, type FeatureExtractionPipeline } from "@huggingface/transformers";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

// Modelos fuera de node_modules para que no se borren al reinstalar dependencias
env.cacheDir = process.env.MODELS_DIR || "./models";

// Hilos de CPU por modelo: deja núcleos libres para otras apps del servidor
export const sessionOptions = { intraOpNumThreads: Number(process.env.MODEL_THREADS) || 2 };

const MODEL = "Xenova/bge-m3";

// Se carga una sola vez, en la primera llamada (~570 MB la primera vez que se descarga)
let extractor: Promise<FeatureExtractionPipeline> | null = null;
function getExtractor() {
  return (extractor ??= pipeline("feature-extraction", MODEL, {
    dtype: "q8",
    session_options: sessionOptions,
  }).catch((err) => {
    extractor = null; // Si falla (p. ej. red en la descarga), reintentar en la próxima llamada
    throw err;
  }));
}

class HFEmbeddings extends Embeddings {
  constructor(params: EmbeddingsParams = {}) {
    super(params);
  }

  // bge-m3 denso: vector del token CLS, normalizado (por eso <#> equivale a coseno)
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const output = await (await getExtractor())(texts, { pooling: "cls", normalize: true });
    return output.tolist() as number[][];
  }

  async embedQuery(text: string): Promise<number[]> {
    const [vector] = await this.embedDocuments([text]);
    return vector;
  }
}

export const embeddings = new HFEmbeddings();
