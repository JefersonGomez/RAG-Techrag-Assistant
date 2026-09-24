// src/db.ts
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// Cargar variables de entorno explícitamente (tsx a veces no lo hace automático)
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Crear el adaptador usando la URL de conexión
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter }); // <--- PASAR EL ADAPTER AQUÍ

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;