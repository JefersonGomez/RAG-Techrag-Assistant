// src/generator-stream.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function* generateAnswerStream(
  question: string,
  context: Array<{ content: string; metadata: Record<string, any> }>
): AsyncGenerator<string> {
  
  const formattedContext = context
    .map((chunk, i) => `[Fuente ${i + 1}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  const prompt = `Eres un asistente técnico experto. Responde SOLO usando el contexto proporcionado.

CONTEXTO:
${formattedContext}

PREGUNTA: ${question}

INSTRUCCIONES:
1. Si la respuesta no está en el contexto, di exactamente: "No tengo información suficiente."
2. Cita fuentes al final de afirmaciones clave: [Fuente X]
3. No inventes código o configuraciones.
4. Sé conciso y técnico.`;

  const stream = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    stream: true, // ← CLAVE PARA SSE
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) yield token;
  }
}