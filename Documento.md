# 📘 Diario de Aprendizaje: TechRAG Assistant

## 1. Stack Tecnológico y Configuración Inicial

| Componente | Tecnología | Versión / Nota Clave |
| :--- | :--- | :--- |
| Runtime | Node.js | v22.12.0 |
| Lenguaje | TypeScript | Strict mode + `@types/node` |
| Ejecución TS | `tsx` | Reemplazo obligatorio de `ts-node` por compatibilidad con TS 5.x+ y Node 22 |
| ORM | Prisma | v7.10.0 (Requiere Driver Adapter explícito) |
| Base de Datos | Supabase PostgreSQL | Plan Free Nano + Extensión `pgvector` activada |
| Conexión DB | Session Pooler | Puerto 5432 vía `pooler.supabase.com` (IPv4 compatible) |
| Embeddings | Hugging Face Inference API | Modelo `BAAI/bge-m3` (Gratuito, multilingüe, código-aware) |
| Orquestación | LangChain.js | `RecursiveCharacterTextSplitter`, `HuggingFaceInferenceEmbeddings` |
| File System | Node.js Nativo | `fs/promises` + `path` (Sin `fs-extra` para evitar deps extra) |

### Comandos de Configuración Críticos
```bash
# Inicialización y deps base
npm init -y
npm install express langchain@0.3.15 @langchain/core@0.3.40 @langchain/community@0.3.28 \
  @huggingface/inference prisma @prisma/client dotenv @prisma/adapter-pg pg
npm install -D typescript tsx @types/node @types/express --legacy-peer-deps

# Setup Prisma 7
npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init
npx prisma generate

# Verificar estado de migraciones
npx prisma migrate status


# Resumen Arquitectónico y Lecciones Técnicas

| Archivo | Función Principal | Lección Técnica Aprendida |
| :--- | :--- | :--- |
| **`prisma.config.ts`** | Configura datasource y schema para Prisma 7 | En v7, la URL va aquí, **NO** en `schema.prisma`. Requiere `dotenv/config` explícito. |
| **`prisma/schema.prisma`** | Define modelo `DocumentChunk` con campo `embedding Float[]` | Prisma no tiene tipo vector nativo; se usa SQL raw con cast `::vector`. |
| **`src/db.ts`** | Singleton de `PrismaClient` con Driver Adapter | **Crítico:** Prisma 7 exige `new PrismaPg({connectionString})` pasado al constructor. Sin adapter = error fatal. |
| **`src/ingestion.ts`** | Recursión asíncrona + chunking inteligente | Filtrado proactivo (`node_modules`, `.git`) ahorra 90% de ruido. Overlap de 50 chars preserva contexto en bordes. |
| **`src/embeddings.ts`** | Wrapper de HuggingFace Inference API | El modelo de embedding determina la calidad del RAG más que el LLM. *BGE-M3* > *Ada-002* para código técnico. |
| **`src/vector-store.ts`** | Pipeline de vectorización + inserción SQL raw | Batching de 5 chunks evita rate limits de HF API gratuita. `$executeRaw` necesario para `pgvector`. |
| **`src/test-ingestion.ts`** | Orquestador del pipeline completo | Punto de entrada para validar Fase 1+2 antes de construir la API. |

---

> 💡 **Nota sobre el Pipeline:** La combinación del procesamiento de archivos nativo, el embedding mediante HuggingFace y el almacenamiento vectorial con `pgvector` en Prisma 7 forman el núcleo de ingesta para el asistente RAG.



3. Problemas Resueltos y Soluciones Definitivas
🔴 Error P1001: Can't reach database server
Causa Raíz: Supabase Direct Connection (puerto 5432 directo) solo resuelve por IPv6. Redes residenciales Windows frecuentemente no soportan IPv6 saliente.
Solución: Usar Session Pooler (aws-0-REGION.pooler.supabase.com:5432). Usuario cambia a postgres.<project-ref>. Compatible con IPv4 y migraciones de Prisma.
Lección: Siempre verificar conectividad con Test-NetConnection host -Port 5432 antes de asumir que la DB está caída.

🔴 TypeError: Cannot read properties of undefined (reading 'fileExists')
Causa Raíz: ts-node incompatible con TypeScript 5.x + Node.js 22.
Solución: Migrar a tsx. Cero configuración, soporte nativo ESM/CJS, compilación SWC ultrarrápida.
Lección: ts-node está en mantenimiento; tsx es el estándar moderno para ejecución TS en desarrollo.

🔴 ENOTFOUND api-inference.huggingface.co
Causa Raíz: DNS local no resuelve endpoint deprecated de HF. Posible bloqueo de firewall/antivirus o ISP restrictivo.
Solución: Cambiar DNS a Cloudflare (1.1.1.1) + agregar HF_ENDPOINT=https://huggingface.co al .env.
Lección: Las APIs de IA gratuitas suelen cambiar endpoints sin aviso. Siempre tener un fallback o variable de entorno configurable.


4. Conceptos Fundamentales de RAG Internalizados

Metadatos > Contenido: Un embedding perfecto con metadatos vacíos vale menos que uno mediocre con metadatos ricos. Los metadatos permiten filtrado antes del retrieval.

Overlap es Obligatorio: Sin solapamiento entre chunks, las ideas cortadas en los bordes generan embeddings semánticamente rotos.
Filtrado Temprano: Descartar node_modules y carpetas ocultas antes de leerlos ahorra recursos de embedding y almacenamiento. Nunca indexar dependencias.

Tolerancia a Fallos Parcial: En ingestión de archivos, un error en un archivo no debe colapsar todo el pipeline. Warnear y continuar es mejor que crasher.

Batching Respetuoso: Las APIs gratuitas tienen rate limits estrictos. Procesar en lotes pequeños (5-10) es la forma profesional de usarlas sin pagar.