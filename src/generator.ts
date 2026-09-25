// src/generator.ts
import Groq from "groq-sdk";
import path from "path";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Genera una respuesta basada en contexto recuperado.
 * Incluye instrucciones anti-alucinación explícitas.
 */
export async function generateAnswer(
  question: string,
  context: Array<{ content: string; metadata: Record<string, any> }>,
): Promise<string> {
  // Formatear contexto con fuentes visibles para el LLM
  const formattedContext = context
    .map((chunk, i) => {
      const source = chunk.metadata?.source
        ? path.basename(chunk.metadata.source)
        : "Documento desconocido";
      return `[Fuente ${i + 1}: ${source}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Eres un asistente técnico experto. Responde SOLO usando la siguiente información proporcionada.

CONTEXTO RECUPERADO:
${formattedContext}

PREGUNTA DEL USUARIO:
${question}

INSTRUCCIONES CRÍTICAS:
1. Si la respuesta NO está en el contexto, di EXACTAMENTE: "No tengo suficiente información en mi base de conocimiento para responder esto."
2. CITA SIEMPRE la fuente entre corchetes al final de cada afirmación clave. Ejemplo: [Fuente 1]
3. No inventes funciones, rutas o configuraciones que no aparezcan en el contexto.
4. Sé conciso y técnico. Evita introducciones genéricas como "Claro, puedo ayudarte con eso".
5. Si el contexto contiene código, preserva el formato exacto.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-20b", // Modelo activo, gratis en el tier free de Groq
    temperature: 0.1,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content || "Sin respuesta generada.";
}
