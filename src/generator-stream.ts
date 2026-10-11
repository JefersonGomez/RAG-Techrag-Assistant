// src/generator-stream.ts
import Groq from "groq-sdk";
import { MANIFESTS } from "./ingestion";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Etiqueta de cada fuente: a un modelo pequeño le cuesta menos seguir "usa las fuentes MANIFIESTO"
// que una regla abstracta sobre "código que implementa vs. contenido que muestra"
function kindOf(source: string): string {
  if (MANIFESTS.includes(source)) return "MANIFIESTO: dependencias reales del proyecto";
  if (/\.(md|txt)$/i.test(source)) return "DOCUMENTACIÓN";
  return "CÓDIGO";
}

const SYSTEM = `Eres un asistente técnico que responde preguntas sobre repositorios de código usando SOLO las fuentes que te da el usuario.

Reglas:
1. Si ninguna fuente sirve para responder, di exactamente: "No tengo información suficiente." Si alguna fuente sirve, responde con ella.
2. Responde SOLO a lo que se pregunta. No añadas secciones, resúmenes ni temas que no se pidieron.
3. Cada afirmación debe salir de una fuente y citarla: [Fuente X]. No menciones nada que no aparezca escrito en las fuentes.
4. No inventes código ni configuraciones.
5. Distingue el proyecto en sí del contenido que muestra. Lo que el proyecto usa (lenguaje, framework, librerías, base de datos, despliegue) solo se deduce de los MANIFIESTOS, de imports y de configuración. Los textos y listas de datos que el proyecto muestra (un CV, una lista de habilidades, descripciones de otros proyectos) son contenido: úsalos solo si la pregunta trata sobre ese contenido.
6. Sé conciso y técnico.`;

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
    return `[Fuente ${i + 1}: ${source}${lines} — ${kindOf(source)}]\n${chunk.content}`;
  })
  .join("\n\n---\n\n");

  const stream = await groq.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `FUENTES:\n${formattedContext}\n\nPREGUNTA: ${question}` },
    ],
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
    temperature: 0.1,
    stream: true, // ← CLAVE PARA SSE
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) yield token;
  }
}
