// src/db.ts
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(); // Sin argumentos, usará prisma.config.ts

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;