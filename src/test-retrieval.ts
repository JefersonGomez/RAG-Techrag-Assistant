// src/test-retrieval.ts
import { retrieveRelevantChunks } from "./retriver";
import { generateAnswer } from "./generator";

async function main() {
  console.log("🔍 Sistema RAG listo. Escribe una pregunta o 'salir' para terminar.\n");

  while (true) {
    const question = await new Promise<string>((resolve) => {
      process.stdout.write("❓ Pregunta: ");
      process.stdin.once("data", (data) => resolve(data.toString().trim()));
    });

    if (question.toLowerCase() === "salir") break;
    if (!question) continue;

    try {
      // 1. Retrieval con filtro opcional (descomenta para probar filtros)
      const chunks = await retrieveRelevantChunks(question, 4, {
        // type: "code"  // ← Descomenta para forzar solo código
      });

      console.log(`\n📚 Recuperados ${chunks.length} chunks relevantes:`);
      chunks.forEach((c, i) => 
        console.log(`  [${i + 1}] Score: ${c.score.toFixed(3)} | ${c.metadata.source}`)
      );

      // 2. Generación
      console.log("\n Generando respuesta...\n");
      const answer = await generateAnswer(question, chunks);
      console.log(`💬 Respuesta:\n${answer}\n`);
      console.log("---\n");

    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
    }
  }

  process.exit(0);
}

main();