# 🤖 TechRAG Assistant

Sistema de Recuperación Aumentada por Generación (RAG) diseñado para asistir en la comprensión de bases de código, documentación técnica y resolución de incidentes. Construido con Node.js, Prisma 7 y Supabase, optimizado para despliegue gratuito en la nube.

## ✨ Características

-   **Ingestión Inteligente:** Chunking recursivo con metadatos estructurados (tipo, lenguaje, origen).
-   **Búsqueda Semántica:** Embeddings con modelo `BAAI/bge-m3` vía Hugging Face (gratuito).
-   **Base de Datos Vectorial:** PostgreSQL + pgvector en Supabase (capa gratuita).
-   **Prisma 7 Ready:** Implementación completa con Driver Adapter y Session Pooler.
-   **100% Gratis para Desarrollo:** Sin costos de API ni infraestructura durante la fase de aprendizaje.

## ️ Arquitectura
[Archivos Locales] → [Chunking + Metadatos] → [Embeddings HF] → [Supabase pgvector]
|
[Pregunta Usuario] → [Búsqueda Semántica] → [Contexto Recuperado] → [LLM Groq/HF] → [Respuesta]



## 🚀 Inicio Rápido

### Prerrequisitos
-   Node.js v22+
-   Cuenta gratuita en [Supabase](https://supabase.com)
-   Token gratuito en [Hugging Face](https://huggingface.co/settings/tokens)

### Instalación

bash
# Clonar e instalar dependencias
git clone <tu-repo>
cd techrag-assistant
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase y Hugging Face

# Aplicar migraciones y generar cliente Prisma
npx prisma migrate dev --name init
npx prisma generate

# Ejecutar pipeline de ingestión de prueba
npx tsx src/test-ingestion.ts

### Variables de Entorno Requeridas
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres"
HUGGINGFACE_API_KEY="hf_..."
HF_ENDPOINT="https://huggingface.co"



### Estructura del Proyecto

techrag-assistant/
├── prisma/
│   ├── config.ts          # Configuración Prisma 7
│   └── schema.prisma      # Modelo DocumentChunk + pgvector
── src/
│   ├── db.ts              # Singleton PrismaClient + Driver Adapter
│   ├── ingestion.ts       # Lectura recursiva + chunking inteligente
│   ├── embeddings.ts      # Cliente HuggingFace Embeddings
│   ├── vector-store.ts    # Vectorización + persistencia SQL raw
│   └── test-ingestion.ts  # Pipeline completo de validación
├── data/                  # Archivos de prueba para ingestión
── LEARNING.md            # Diario técnico interno (no compartir públicamente)
└── README.md




### Stack Tecnológico
Backend Node.js 22 + TypeScript
ORM Prisma 7 + @prisma/adapter-pg
Base de Datos Supabase PostgreSQL + pgvector
Embeddings HuggingFace Inference API (BGE-M3)
Ejecución TS tsx (SWC-based)
File System Node.js fs/promises nativo


📝 Fases de Desarrollo
✅ Fase 1: Ingestión y Chunking Inteligente
✅ Fase 2: Vectorización y Almacenamiento en Supabase
🔄 Fase 3: Retrieval Semántico + Generación con LLM (Próximo)
⏳ Fase 4: API Express + Despliegue en Render/Railway
⚠️ Notas Técnicas
Se usa --legacy-peer-deps debido a conflictos internos en @langchain/community. Seguro para desarrollo.
Los embeddings se procesan en lotes de 5 para respetar rate limits de HF gratis.
El chunk overlap está configurado en 50 caracteres para preservar contexto en bordes.
node_modules y carpetas ocultas son excluidos automáticamente durante la ingestión.