import { PrismaClient } from '@prisma/client';

/**
 * Un seul client Prisma par processus.
 *
 * En développement, Next.js réévalue les modules à chaque modification : sans
 * ce cache global, chaque rechargement ouvrait une connexion supplémentaire
 * jusqu'à saturer PostgreSQL. Le même problème se pose en serverless, où la
 * cible de déploiement est une base gérée avec un pooler (REBUILD.md T0.1).
 *
 * `apps/web/src/app/api/auth/[...nextauth]/route.ts` faisait `new PrismaClient()`
 * au niveau du module : c'est précisément ce que ce fichier remplace.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
