// src/embeddings.ts
import { InferenceClient } from "@huggingface/inference";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const MODEL = "BAAI/bge-m3";

class HFEmbeddings extends Embeddings {
  constructor(params: EmbeddingsParams = {}) {
    super(params);
  }

  // Una sola llamada para todo el lote: la API acepta un array de textos
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors = await client.featureExtraction({
      model: MODEL,
      inputs: texts,
    });
    return vectors as number[][];
  }

  async embedQuery(text: string): Promise<number[]> {
    const vector = await client.featureExtraction({
      model: MODEL,
      inputs: text,
    });
    return vector as number[];
  }
}

export const embeddings = new HFEmbeddings();
