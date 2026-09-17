#!/usr/bin/env tsx
/**
 * Réparation ponctuelle : la collecte WooCommerce du 17 septembre 2026 a enregistré les
 * traductions des fiches (WPML, Polylang) comme des produits distincts — ~1 800 fiches
 * en anglais, allemand, espagnol, néerlandais — et deux marques sans `slug` dans l'API
 * ont reçu des slugs `<marque>-undefined`. Le scraper filtre désormais à la source
 * (`langue.ts`) ; ce script retire l'existant, puis on relance la collecte des marques
 * touchées pour retrouver les originales françaises perdues par collision de slug.
 *
 * Ne retire que des produits `woocommerce` collectés par le script, jamais une fiche
 * saisie à la main (elles n'ont pas de permalien étranger). Idempotent.
 *
 *   pnpm exec tsx --env-file=.env scripts/catalogue/retirer-traductions.ts [--simuler]
 */
import { PrismaClient } from '@prisma/client';
import { estFicheFrancaise } from './langue';

const prisma = new PrismaClient();
const simuler = process.argv.includes('--simuler');

async function main() {
  const collectes = await prisma.product.findMany({
    where: { externalSource: 'woocommerce' },
    select: { id: true, slug: true, externalBuyUrl: true, brand: { select: { name: true, slug: true } } },
  });

  const aRetirer = collectes.filter(
    (p) => !estFicheFrancaise(p.externalBuyUrl) || p.slug.endsWith('-undefined'),
  );

  const parMarque = new Map<string, { slug: string; n: number }>();
  for (const p of aRetirer) {
    const m = parMarque.get(p.brand.name) ?? { slug: p.brand.slug, n: 0 };
    m.n += 1;
    parMarque.set(p.brand.name, m);
  }
  for (const [nom, m] of parMarque) console.log(`  ${nom} : ${m.n} fiche(s) à retirer`);

  if (!simuler && aRetirer.length > 0) {
    const { count } = await prisma.product.deleteMany({ where: { id: { in: aRetirer.map((p) => p.id) } } });
    console.log(`\n  ${count} fiches retirées sur ${collectes.length} collectées WooCommerce`);
  } else {
    console.log(`\n  ${aRetirer.length} fiches à retirer sur ${collectes.length} collectées WooCommerce`);
  }
  console.log(`\n  Marques à recollecter : ${[...parMarque.values()].map((m) => m.slug).join(' ')}`);
}
main().finally(() => prisma.$disconnect());
