// src/routes/ask.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { retrieveRelevantChunks } from '../retriver';
import { generateAnswerStream } from '../generator-stream';
import { getCachedAnswer, setCachedAnswer } from '../cache';

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

    // Check caché
    const cached = await getCachedAnswer(question, filters);
    if (cached) {
      console.log('💾 Respuesta servida desde caché');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      res.write(`data: ${JSON.stringify({ type: 'sources', count: cached.sources.length, fromCache: true })}\n\n`);
      
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

    const chunks = await retrieveRelevantChunks(question, 4, filters);
    res.write(`data: ${JSON.stringify({ type: 'sources', count: chunks.length })}\n\n`);

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