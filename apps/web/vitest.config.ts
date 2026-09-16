import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Tests de l'application web (REBUILD.md T6.1).
 *
 * Environnement Node : on teste des gardes, des fonctions de requête et des règles
 * métier, pas des composants rendus. Les parcours dans un navigateur relèvent de
 * Playwright (T6.4), pas d'ici.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
