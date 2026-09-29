// src/generator-stream.ts
import Groq from "groq-sdk";
import * as path from 'path';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function* generateAnswerStream(
  question: string,
  context: Array<{ content: string; metadata: Record<string, any> }>
): AsyncGenerator<string> {
  
  const formattedContext = context
  .map((chunk, i) => {
    const source = chunk.metadata?.source 
      ? path.basename(chunk.metadata.source) 
      : "Documento desconocido";
    const lines = chunk.metadata?.startLine && chunk.metadata?.endLine
      ? ` (líneas ${chunk.metadata.startLine}-${chunk.metadata.endLine})`
      : '';
    return `[Fuente ${i + 1}: ${source}${lines}]\n${chunk.content}`;
  })
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
    model: "openai/gpt-oss-20b",
    temperature: 0.1,
    stream: true, // ← CLAVE PARA SSE
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) yield token;
  }
}