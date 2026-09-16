import { execSync } from 'node:child_process';
import path from 'node:path';
import { config } from 'dotenv';
import { urlBaseDeTest } from './db-url';

/**
 * Une fois avant toute la suite : appliquer les migrations sur la base de test.
 * `prisma migrate deploy` ne pose aucune question et ne détruit rien — c'est la
 * seule commande de migration autorisée sur ce projet (CLAUDE.md, règle 17).
 */
export default function setup(): void {
  const racine = path.resolve(__dirname, '../../../../..');
  config({ path: path.join(racine, '.env') });
  const url = urlBaseDeTest();
  process.env.DATABASE_URL = url;

  // Chemin relatif au `cwd` : un chemin absolu contenant un espace (« 1 Projets »)
  // serait decoupe par le shell.
  execSync('npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma', {
    cwd: racine,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: url },
  });
}
