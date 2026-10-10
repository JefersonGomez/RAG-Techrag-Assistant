// src/index.ts
import express from 'express';
import * as path from 'path';
import askRouter from './routes/ask';
import ingestRepoRouter from './routes/ingest-repo';
import conversationsRouter from './routes/conversations';
import feedbackRouter from './routes/feedback';
import healthRouter from './routes/health';
import authRouter from './auth';
import { embeddings } from './embeddings';
import { warmupReranker } from './reranker';

const app = express();

// Detrás de nginx: confiar en 1 proxy para que el rate limit vea la IP real del cliente
app.set('trust proxy', 1);

// Middlewares globales PRIMERO (sin CORS: el frontend se sirve desde este mismo origen)
app.use(express.json({ limit: '100kb' }));

// Rutas DESPUÉS
app.use(authRouter);
app.use(askRouter);
app.use(ingestRepoRouter);
app.use(conversationsRouter);
app.use(feedbackRouter);
app.use(healthRouter);

// Frontend compilado (web/dist). Cualquier ruta que no sea API ni auth devuelve la SPA.
const webDist = path.resolve(__dirname, '../web/dist');
app.use(express.static(webDist, { index: false, maxAge: '1y', immutable: true }));
app.get(/^\/(?!api\/|auth\/).*/, (req, res) => {
  res.sendFile(path.join(webDist, 'index.html'), { maxAge: 0 }, (err) => {
    if (err) res.status(404).send('Frontend no compilado: ejecuta "npm run build:web"');
  });
});

// Errores no controlados: detalle solo en el log, nunca la traza al cliente
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Error en ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error interno' });
});

const PORT = Number(process.env.PORT) || 3000;
// Solo localhost: desde fuera se entra por nginx
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(` TechRAG API corriendo en ${HOST}:${PORT}`);

  // En producción, precargar modelos (la 1ª vez los descarga, ~1,1 GB) para que la primera pregunta no espere.
  // En desarrollo se cargan recién en la primera pregunta.
  if (process.env.NODE_ENV !== 'production') return;
  Promise.all([embeddings.embedQuery('warmup'), warmupReranker()])
    .then(() => console.log('🧠 Modelos locales cargados'))
    .catch((err) => console.error('⚠️ No se pudieron precargar los modelos:', err));
});
