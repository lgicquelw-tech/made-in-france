#!/usr/bin/env tsx
/**
 * Réparation ponctuelle : les noms de produits importés avant le 17 septembre 2026
 * portaient des balises et des entités HTML (« &#8211; », « <br/> »). Les scrapers les
 * nettoient désormais à la source ; ce script rattrape l'existant. Idempotent.
 *
 *   pnpm exec tsx --env-file=.env scripts/catalogue/reparer-noms.ts [--simuler]
 */
import { PrismaClient } from '@prisma/client';
import { texteDepuisHtml } from './html';

const prisma = new PrismaClient();
const simuler = process.argv.includes('--simuler');

async function main() {
  const suspects = await prisma.product.findMany({
    where: { OR: [{ name: { contains: '<' } }, { name: { contains: '&' } }] },
    select: { id: true, name: true },
  });
  let n = 0;
  for (const p of suspects) {
    const propre = texteDepuisHtml(p.name);
    if (!propre || propre === p.name) continue;
    if (!simuler) await prisma.product.update({ where: { id: p.id }, data: { name: propre } });
    n++;
    if (n <= 5) console.log(`  « ${p.name} » → « ${propre} »`);
  }
  console.log(`\n  ${n} noms ${simuler ? 'à réparer' : 'réparés'} sur ${suspects.length} suspects`);
}
main().finally(() => prisma.$disconnect());
