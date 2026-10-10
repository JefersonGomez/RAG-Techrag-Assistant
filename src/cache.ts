// src/cache.ts
import Redis from 'ioredis';

// Sin cola offline ni reintentos: si Redis está caído, falla rápido y seguimos sin caché
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});
redis.on('error', (err) => console.warn('⚠️ Redis:', err.message));

export interface CacheEntry {
  answer: string;
  sources: Array<{ id?: string; content: string; metadata: Record<string, any>; score: number }>;
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
  try {
    const cached = await redis.get(generateCacheKey(question, filters));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn('⚠️ Caché no disponible (lectura):', (err as Error).message);
    return null;
  }
}

export async function setCachedAnswer(
  question: string,
  filters: Record<string, string> | undefined,
  entry: CacheEntry,
  ttlSeconds: number = 3600 // 1 hora por defecto
): Promise<void> {
  try {
    await redis.setex(generateCacheKey(question, filters), ttlSeconds, JSON.stringify(entry));
  } catch (err) {
    console.warn('⚠️ Caché no disponible (escritura):', (err as Error).message);
  }
}

// Se llama tras cada ingesta con cambios: las respuestas cacheadas ya no reflejan el índice
export async function invalidateCache(pattern: string = 'rag:*'): Promise<number> {
  try {
    // ponytail: KEYS bloquea Redis con muchas claves; cambiar a scanStream si la caché crece
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await redis.del(...keys);
  } catch (err) {
    console.warn('⚠️ No se pudo invalidar la caché:', (err as Error).message);
    return 0;
  }
}
