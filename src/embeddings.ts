// src/embeddings.ts
import { InferenceClient } from "@huggingface/inference";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const MODEL = "BAAI/bge-m3";

class HFEmbeddings extends Embeddings {
  constructor(params: EmbeddingsParams = {}) {
    super(params);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const vector = await client.featureExtraction({
        model: MODEL,
        inputs: text,
      });
      results.push(vector as number[]);
    }
    return results;
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