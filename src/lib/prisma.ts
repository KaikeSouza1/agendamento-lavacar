import { PrismaClient } from '@prisma/client';

// Declara uma variável global para o Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Exporta uma instância única do Prisma Client
// Se já existir uma instância, reutiliza-a. Senão, cria uma nova.
// Isso evita criar novas conexões a cada recarregamento em desenvolvimento
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;