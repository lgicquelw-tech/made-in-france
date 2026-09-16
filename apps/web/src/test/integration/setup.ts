import path from 'node:path';
import { config } from 'dotenv';
import { beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { urlBaseDeTest } from './db-url';

/**
 * Avant chaque fichier : pointer Prisma sur la base de test — AVANT d'importer
 * `@/lib/db`, qui lit `DATABASE_URL` à la construction du client.
 */
config({ path: path.resolve(__dirname, '../../../../../.env') });
process.env.DATABASE_URL = urlBaseDeTest();
process.env.NEXTAUTH_SECRET ??= 'secret-de-test';

/** La session est simulée ; c'est le seul élément qui ne soit pas réel. */
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import { prisma } from '@/lib/db';

beforeAll(async () => {
  const chemin = new URL(process.env.DATABASE_URL ?? '').pathname;
  if (!/_test$/.test(chemin)) {
    throw new Error(`Refus : la base « ${chemin} » ne se termine pas par _test.`);
  }
});

/**
 * Vider les tables métier avant chaque test. Gabarit **statique** : aucune valeur
 * n'y entre, donc pas de `$executeRawUnsafe` — la règle 3 de CLAUDE.md ne connaît
 * pas d'exception, même pour une constante.
 */
beforeEach(async () => {
  await prisma.$executeRaw`
    TRUNCATE TABLE "brand_claim_requests", "brand_owners", "favorites", "brand_views",
                   "products", "brands", "users" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
