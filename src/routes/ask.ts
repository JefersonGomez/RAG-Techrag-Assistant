// src/routes/ask.ts
import { Router } from 'express';
import * as crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { retrieveRelevantChunks } from '../retriver'; // ✅ Corregido: era 'retriver'
import { generateAnswerStream } from '../generator-stream';
import { getCachedAnswer, setCachedAnswer } from '../cache';
import { rerankChunks } from '../reranker';

const router = Router();

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas peticiones. Espera 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/api/ask', askLimiter, async (req, res) => {
  try {
    const { question, filters } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Se requiere una pregunta válida' });
    }

    // Generar ID único para esta respuesta (necesario para feedback)
    const responseId = crypto.randomUUID();

    // Check caché
    const cached = await getCachedAnswer(question, filters);
    if (cached) {
      console.log('💾 Respuesta servida desde caché');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      //  Incluir responseId en evento sources cacheado
      res.write(`data: ${JSON.stringify({ 
        type: 'sources', 
        count: cached.sources.length, 
        fromCache: true,
        responseId 
      })}\n\n`);
      
      const tokens = cached.answer.split(/(?<=\s)/);
      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
        await new Promise(r => setTimeout(r, 10));
      }
      
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // Sin caché: proceder normal
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const rawChunks = await retrieveRelevantChunks(question, 20, filters); // ← Pedir 20 candidatos baratos
const chunks = rawChunks.length > 4 
  ? await rerankChunks(question, rawChunks, 4)  // ← Re-rankear solo si hay suficientes
  : rawChunks.map(c => ({ ...c, rerankScore: c.score })); 
    
    // Incluir responseId en evento sources nuevo
    res.write(`data: ${JSON.stringify({ 
      type: 'sources', 
      count: chunks.length,
      responseId 
    })}\n\n`);

    let fullAnswer = '';
    const stream = await generateAnswerStream(question, chunks);
    
    for await (const chunk of stream) {
      fullAnswer += chunk;
      res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
    }

    await setCachedAnswer(question, filters, {
      answer: fullAnswer,
      sources: chunks,
      timestamp: Date.now()
    });

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error('Error en /api/ask:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Error interno' 
    })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

export default router;