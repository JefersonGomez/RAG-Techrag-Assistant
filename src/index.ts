// src/index.ts
import express from 'express';
import cors from 'cors';
import askRouter from './routes/ask';
import ingestRepoRouter from './routes/ingest-repo';

const app = express();

// Middlewares globales PRIMERO
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rutas DESPUÉS
app.use(askRouter);
app.use(ingestRepoRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` TechRAG API corriendo en puerto ${PORT}`);
});