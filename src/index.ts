// src/index.ts
import express from 'express';
import cors from 'cors';
import askRouter from './routes/ask';
import ingestRepoRouter from './routes/ingest-repo';

import feedbackRouter from './routes/feedback'; 
import healthRouter from './routes/health';   
import { embeddings } from './embeddings';
import { warmupReranker } from './reranker';

const app = express();

// Detrás de nginx: confiar en 1 proxy para que el rate limit vea la IP real del cliente
app.set('trust proxy', 1);

// Middlewares globales PRIMERO
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rutas DESPUÉS
app.use(askRouter);
app.use(ingestRepoRouter);

app.use(feedbackRouter); 
app.use(healthRouter); 

const PORT = Number(process.env.PORT) || 3000;
// Solo localhost: desde fuera se entra por nginx
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(` TechRAG API corriendo en ${HOST}:${PORT}`);

  // Precargar modelos (la 1ª vez los descarga, ~1,1 GB) para que la primera pregunta no espere
  Promise.all([embeddings.embedQuery('warmup'), warmupReranker()])
    .then(() => console.log('🧠 Modelos locales cargados'))
    .catch((err) => console.error('⚠️ No se pudieron precargar los modelos:', err));
});