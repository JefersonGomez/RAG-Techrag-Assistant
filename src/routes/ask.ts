// src/routes/ask.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { retrieveRelevantChunks, parseFilters } from '../retriver';
import { generateAnswerStream } from '../generator-stream';
import { getCachedAnswer, setCachedAnswer } from '../cache';
import { rerankChunks } from '../reranker';
import { requireAuth } from '../auth';
import { prisma } from '../db';

const router = Router();

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas peticiones. Espera 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

type Chunk = { id?: string; content: string; metadata: Record<string, any>; score: number; rerankScore?: number };

// Lo que ve el frontend de cada fuente (la "tracklist" de la respuesta)
function toSources(chunks: Chunk[]) {
  return chunks.map((c) => ({
    id: c.id,
    source: c.metadata?.source ?? 'desconocido',
    repoUrl: c.metadata?.repoUrl,
    startLine: c.metadata?.startLine,
    endLine: c.metadata?.endLine,
    score: c.rerankScore ?? c.score,
    content: c.content,
  }));
}

router.post('/api/ask', requireAuth, askLimiter, async (req, res) => {
  const { question, conversationId } = req.body ?? {};

  if (!question || typeof question !== 'string' || question.length > 2000) {
    return res.status(400).json({ error: 'Se requiere una pregunta válida (máx. 2000 caracteres)' });
  }
  if (conversationId !== undefined && typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId inválido' });
  }

  let filters: Record<string, string> | undefined;
  try {
    filters = parseFilters(req.body.filters);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const userId: string = res.locals.user.id;
  const conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId } })
    : await prisma.conversation.create({
        data: { userId, title: question.trim().slice(0, 80), repoUrl: filters?.repoUrl },
      });
  if (!conversation) return res.status(404).json({ error: 'Conversación no encontrada' });

  await prisma.message.create({ data: { conversationId: conversation.id, role: 'user', content: question } });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    send({ type: 'conversation', conversationId: conversation.id });

    let answer = '';
    let sources: ReturnType<typeof toSources>;

    const cached = await getCachedAnswer(question, filters);
    if (cached) {
      console.log('💾 Respuesta servida desde caché');
      sources = toSources(cached.sources);
      send({ type: 'sources', sources, fromCache: true });
      for (const token of cached.answer.split(/(?<=\s)/)) {
        answer += token;
        send({ type: 'token', content: token });
        await new Promise(r => setTimeout(r, 10));
      }
    } else {
      const rawChunks = await retrieveRelevantChunks(question, 20, filters); // ← Pedir 20 candidatos baratos
      const chunks = rawChunks.length > 4
        ? await rerankChunks(question, rawChunks, 4)  // ← Re-rankear solo si hay suficientes
        : rawChunks.map(c => ({ ...c, rerankScore: c.score }));

      sources = toSources(chunks);
      send({ type: 'sources', sources });

      for await (const token of generateAnswerStream(question, chunks)) {
        answer += token;
        send({ type: 'token', content: token });
      }

      await setCachedAnswer(question, filters, { answer, sources: chunks, timestamp: Date.now() });
    }

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, role: 'assistant', content: answer, sources },
    });
    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    send({ type: 'done', conversationId: conversation.id, messageId: message.id });
  } catch (error) {
    console.error('Error en /api/ask:', error);
    send({ type: 'error', message: error instanceof Error ? error.message : 'Error interno' });
  }
  res.write(`data: [DONE]\n\n`);
  res.end();
});

export default router;
