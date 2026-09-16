import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { config as chargerEnv } from 'dotenv';
import { urlBaseDeTest } from './src/test/integration/db-url';

/**
 * Parcours navigateur (REBUILD.md T6.4, T6.5).
 *
 * Le serveur Next est lancé par Playwright **sur la base `_test`**, jamais sur la base de
 * développement : `global-setup.ts` la vide et y sème un jeu de données minimal et connu.
 * Les mêmes garde-fous qu'en intégration s'appliquent (`db-url.ts`).
 *
 * En local, `next dev` ; en CI, `next start` sur le build que la CI vient de produire —
 * on teste ce qui sera déployé, pas un mode développement.
 */

chargerEnv({ path: path.resolve(__dirname, '../../.env') });

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const URL_TEST = urlBaseDeTest();

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI
      ? `pnpm exec next start -p ${PORT}`
      : `pnpm exec next dev -p ${PORT}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: URL_TEST,
      NEXTAUTH_URL: BASE,
      NEXT_PUBLIC_APP_URL: BASE,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'secret-de-test',
    },
  },
});
