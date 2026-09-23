📄 Documento de Proyecto: TechRAG Assistant
1. Descripción General
TechRAG es un sistema de Recuperación Aumentada por Generación (RAG) diseñado para asistir en la comprensión de bases de código, documentación técnica y resolución de incidentes. A diferencia de los chatbots genéricos, este sistema utiliza metadatos estructurados y búsqueda semántica para proporcionar respuestas precisas basadas en el contexto real del proyecto.
2. Objetivos
Implementar un pipeline de ingestión de datos capaz de procesar código fuente y documentos técnicos.
Utilizar herramientas gratuitas y escalables para el despliegue en la nube.
Proporcionar una API en Node.js que permita realizar consultas naturales sobre la información indexada.
3. Stack Tecnológico (Free Tier)
Runtime: Node.js (v18+)
Framework: Express.js o Fastify
Orquestación: LangChain.js
Base de Datos Vectorial: Supabase (PostgreSQL + pgvector)
ORM: Prisma
Embeddings: Hugging Face Inference API (Modelo: BGE-M3 o Nomic-embed-text)
LLM: Groq Cloud (Modelo: Llama-3.1-8b-instant)
Hosting: Render.com o Railway
4. Fases de Desarrollo
Ingestión y Chunking: Lectura de archivos y división inteligente.
Vectorización y Almacenamiento: Generación de embeddings y persistencia en Supabase.
Retrieval y Generación: Búsqueda semántica y respuesta del LLM.
Despliegue: Configuración de entorno y puesta en producción.