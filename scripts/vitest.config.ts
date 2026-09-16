import { defineConfig } from 'vitest/config';

/**
 * Tests du paquet scripts (REBUILD.md T6.1).
 *
 * Les 62 tests écrits en phase 5 tournaient sur le lanceur intégré à Node 22, pour ne
 * pas préempter ce choix. Ils passent à Vitest en ne changeant qu'une ligne — l'import
 * de `test` — parce que leurs assertions viennent de `node:assert/strict`, que Vitest
 * exécute telles quelles.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**'],
  },
});
