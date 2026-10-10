// src/routes/conversations.ts
import { Router, type Request } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../auth';

const router = Router();

router.get('/api/conversations', requireAuth, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: res.locals.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: { id: true, title: true, repoUrl: true, updatedAt: true, _count: { select: { messages: true } } },
  });
  res.json(conversations.map(({ _count, ...c }) => ({ ...c, messageCount: _count.messages })));
});

router.get('/api/conversations/:id', requireAuth, async (req: Request<{ id: string }>, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: res.locals.user.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversación no encontrada' });
  res.json(conversation);
});

router.delete('/api/conversations/:id', requireAuth, async (req: Request<{ id: string }>, res) => {
  const { count } = await prisma.conversation.deleteMany({ where: { id: req.params.id, userId: res.locals.user.id } });
  if (count === 0) return res.status(404).json({ error: 'Conversación no encontrada' });
  res.json({ ok: true });
});

// Repos indexados: el selector "cinta" del frontend
router.get('/api/repos', requireAuth, async (req, res) => {
  const repos = await prisma.repoIngestion.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { repoUrl: true, branch: true, chunksCount: true, updatedAt: true },
  });
  res.json(repos);
});

export default router;
