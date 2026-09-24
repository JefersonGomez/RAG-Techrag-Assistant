// aca va la logica de embebido, entonces lo que pasa esque esto convierte testo en lejguajes de numeros llamada vector 
//para que asi un LLM lo pueda entender

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

//esta libreria nos permitira traducir de texto a lenguaje numerico
// en este caso usasmos Hugging face porque es gratis

// aca vamos a usar el modelo llamado "BAAI/bge-m3" un modele para busqueda semantica

//busqueda semantica : método para encontrar fragmentos de código fuente basándose 
// en su significado y contexto en lugar de buscar coincidencias exactas de palabras clave

export const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey:process.env.HUGGINGFACE_API_KEY,
    model: "BAAI/bge-m3"
})