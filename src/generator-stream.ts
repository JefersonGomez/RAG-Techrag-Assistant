// src/generator-stream.ts
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function* generateAnswerStream(
  question: string,
  context: Array<{ content: string; metadata: Record<string, any> }>
): AsyncGenerator<string> {
  
  const formattedContext = context
  .map((chunk, i) => {
    const source = chunk.metadata?.source || "Documento desconocido";
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
2. Responde SOLO a lo que se pregunta. No añadas secciones, resúmenes ni temas que no se pidieron.
3. Cada afirmación debe estar respaldada por una fuente y citarla: [Fuente X]. Si algo no aparece en el contexto, no lo menciones.
4. No inventes código o configuraciones.
5. Distingue el código que implementa el repositorio (manifiestos como package.json o go.mod, imports, configuración) del contenido que el repositorio muestra o almacena (textos, listas de datos, descripciones de otros proyectos). Si preguntan con qué está hecho o qué tecnologías usa, responde SOLO con lo primero e ignora lo segundo.
6. Sé conciso y técnico.`;

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