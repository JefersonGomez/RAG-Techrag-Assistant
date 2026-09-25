//servidor express

import express from "express";
import cors from "cors";
import ingestRepoRouter from "./routes/ingest-repo";

import { retrieveRelevantChunks } from "./retriver";

import { generateAnswerStream } from "./generator-stream";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(ingestRepoRouter);

const PORT = process.env.PORT || 3000;

// src/index.ts
// src/index.ts (CORREGIDO para SSE)
app.post('/api/ask', async (req, res) => {
  try {
    const { question, filters } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Se requiere una pregunta válida' });
    }

    // Configurar headers SSE ANTES de cualquier operación asíncrona
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // ← Forzar envío inmediato de headers

    const chunks = await retrieveRelevantChunks(question, 4, filters);
    
    res.write(`data: ${JSON.stringify({ type: 'sources', count: chunks.length })}\n\n`);

    const stream = await generateAnswerStream(question, chunks);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error('Error en /api/ask:', error);
    // ✅ ENVIAR ERROR COMO EVENTO SSE, NO COMO JSON
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Error interno' 
    })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TechRAG API corriendo en puerto ${PORT}`);
});
