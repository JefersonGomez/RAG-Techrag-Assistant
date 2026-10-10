import { Router } from "express";
import { prisma } from "../db";
import { Groq } from "groq-sdk";
import { redis } from "../cache";

const router = Router();

// Chequeos que validan credenciales sin gastar tokens ni cuota de inferencia
const checks: Record<string, () => Promise<unknown>> = {
  supabase: () => prisma.$queryRaw`SELECT 1`,
  groq: () => new Groq({ apiKey: process.env.GROQ_API_KEY }).models.list(),
  redis: () => redis.ping(),
};

router.get("/api/health", async (req, res) => {
  const names = Object.keys(checks);
  const results = await Promise.allSettled(names.map((name) => checks[name]()));
  const status = Object.fromEntries(
    names.map((name, i) => [name, results[i].status === "fulfilled" ? "OK" : "FALLIDO"])
  );
  // Redis es opcional: sin él /api/ask sigue funcionando sin caché
  const allHealthy = names.every((name) => name === "redis" || status[name] === "OK");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    checks: status,
    timestamp: new Date().toISOString(),
  });
});

export default router;
