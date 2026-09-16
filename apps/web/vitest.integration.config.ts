import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Tests d'intégration (REBUILD.md T6.3) : une **vraie base PostgreSQL**, dédiée.
 *
 * Ce que les tests unitaires ne prouvent pas et que ceux-ci prouvent : que la garde
 * relit réellement le rôle en base, qu'une revendication crée réellement une ligne,
 * qu'un favori compte réellement des points. On appelle les Route Handlers comme des
 * fonctions ; la session est simulée, la base ne l'est pas.
 *
 * La base est `madeinfrance_test`, jamais la base de développement. Elle est migrée
 * avant la suite (`global-setup.ts`) et vidée avant chaque test (`setup.ts`). Les
 * tests tournent **en série** : ils partagent la base.
 */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.itest.ts'],
    globalSetup: ['./src/test/integration/global-setup.ts'],
    setupFiles: ['./src/test/integration/setup.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
