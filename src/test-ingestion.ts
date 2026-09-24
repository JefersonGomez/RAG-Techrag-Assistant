// src/test-ingestion.ts
import { processDirectory } from "./ingestion"; // Fase 1: Leer archivos
import { storeChuncks } from "./vector-store";   // Fase 2: Vectorizar y guardar
import { prisma } from "./db";                  // Conexión a Supabase

async function main() {
  console.log("🚀 Iniciando Pipeline RAG Completo");
  
  // 1. Obtener los trozos de texto limpios
  const chunks = await processDirectory("./data");
  console.log(`📄 Se encontraron ${chunks.length} fragmentos para procesar`);
  
  if (chunks.length === 0) {
    console.log("⚠️ La carpeta ./data está vacía o no tiene archivos válidos");
    return;
  }
  
  // 2. Convertir a vectores y guardar en Supabase
  await storeChuncks(chunks);
  
  // 3. Verificación: Contar cuántos registros hay en la BD
  // Nota: Como usamos SQL raw para insertar, Prisma NO puede hacer .count() 
  // directamente sobre el modelo si no regeneramos el cliente tras la migración.
  // Pero si ya hiciste 'prisma generate', esto debería funcionar.
  const count = await prisma.documentChunk.count();
  console.log(` Total de chunks almacenados en Supabase: ${count}`);
}

main().catch((e) => {
  console.error("❌ Error en el pipeline:", e);
  process.exit(1);
});