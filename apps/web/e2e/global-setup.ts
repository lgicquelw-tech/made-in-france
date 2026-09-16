import { execSync } from 'node:child_process';
import path from 'node:path';
import { config as chargerEnv } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { urlBaseDeTest } from '../src/test/integration/db-url';
import { DONNEES } from './donnees';

/**
 * Une fois avant tous les parcours : migrer la base de test, la vider, y semer le jeu
 * de données. Le serveur Next lancé par Playwright lira cette base et rien d'autre.
 */
export default async function setup(): Promise<void> {
  const racine = path.resolve(__dirname, '../../..');
  chargerEnv({ path: path.join(racine, '.env') });
  const url = urlBaseDeTest();
  if (!/_test$/.test(new URL(url).pathname)) throw new Error(`Refus : « ${url} » n'est pas une base de test.`);

  execSync('npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma', {
    cwd: racine, stdio: 'pipe', env: { ...process.env, DATABASE_URL: url },
  });

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$executeRaw`
      TRUNCATE TABLE "brand_claim_requests", "brand_owners", "favorites", "brand_views",
                     "products", "brands", "users", "sectors", "regions" CASCADE`;

    const region = await prisma.region.create({ data: { name: 'Bretagne', slug: 'bretagne' } });
    const secteur = await prisma.sector.create({ data: { name: 'Mode & Accessoires', slug: 'mode-accessoires', color: '#002395' } });
    const marque = await prisma.brand.create({ data: {
      ...DONNEES.marque, status: 'ACTIVE', regionId: region.id, sectorId: secteur.id,
      descriptionShort: 'Atelier de tricot breton, créé pour les parcours de test.',
    } });
    await prisma.product.create({ data: { ...DONNEES.produit, brandId: marque.id, status: 'ACTIVE', currency: 'EUR', priceMax: 89 } });
    await prisma.brand.create({ data: { ...DONNEES.marqueAccentuee, status: 'ACTIVE', regionId: region.id, sectorId: secteur.id, descriptionShort: 'Crèmerie bretonne, semée pour tester la recherche sans accent.' } });
    await prisma.user.create({ data: {
      email: DONNEES.utilisateur.email, name: DONNEES.utilisateur.name,
      password: await bcrypt.hash(DONNEES.utilisateur.password, 10), role: 'USER', isActive: true,
    } });
    await prisma.user.create({ data: {
      email: DONNEES.admin.email, name: DONNEES.admin.name,
      password: await bcrypt.hash(DONNEES.admin.password, 10), role: 'ADMIN', isActive: true,
    } });
  } finally {
    await prisma.$disconnect();
  }
}
