// src/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface CacheEntry {
  answer: string;
  sources: Array<{ content: string; metadata: Record<string, any>; score: number }>;
  timestamp: number;
}

/**
 * Genera clave única basada en pregunta + filtros
 * Dos preguntas idénticas con filtros distintos NO deben compartir caché
 */
function generateCacheKey(question: string, filters?: Record<string, string>): string {
  const filterStr = filters ? JSON.stringify(Object.entries(filters).sort()) : '';
  return `rag:${Buffer.from(`${question}|${filterStr}`).toString('base64')}`;
}

export async function getCachedAnswer(
  question: string, 
  filters?: Record<string, string>
): Promise<CacheEntry | null> {
  const key = generateCacheKey(question, filters);
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedAnswer(
  question: string,
  filters: Record<string, string> | undefined,
  entry: CacheEntry,
  ttlSeconds: number = 3600 // 1 hora por defecto
): Promise<void> {
  const key = generateCacheKey(question, filters);
  await redis.setex(key, ttlSeconds, JSON.stringify(entry));
}

export async function invalidateCache(pattern: string = 'rag:*'): Promise<number> {
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;
  return await redis.del(...keys);
}