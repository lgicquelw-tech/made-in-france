#!/usr/bin/env tsx
/**
 * Publication au seuil de complétude — `pnpm data:publish` (REBUILD.md T5.8).
 *
 * Passe tous les produits, applique la règle de `policy.ts`, et écrit le statut qui en
 * découle. Idempotent : un second passage ne change rien.
 *
 * Ce que la commande ne fait **pas** : toucher aux marques. 902 marques sur 903 sont
 * en `PENDING_REVIEW` et servies publiquement quand même ; les publier ou les retirer
 * est une décision éditoriale, pas une mesure de complétude. Elle est consignée dans
 * `REBUILD.md` et attend un arbitrage humain.
 *
 * Options :
 *   --simuler    n'écrit rien : annonce ce qui serait fait
 */

import { PrismaClient } from '@prisma/client';
import { deciderStatut, type StatutProduit } from './policy';
import type { FicheProduit } from '../audit/checks';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const simuler = process.argv.includes('--simuler');

  const produits = await prisma.product.findMany({
    select: {
      id: true, name: true, status: true,
      descriptionShort: true, imageUrl: true, priceMin: true,
      externalBuyUrl: true, affiliateUrl: true, categoryId: true,
      galleryUrls: true, materials: true, madeInFranceLevel: true, buyUrlDeadAt: true,
      brand: { select: { name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  console.log('\nPublication au seuil de complétude');
  console.log('─'.repeat(78));
  console.log(`  ${produits.length} produits examinés${simuler ? ' — MODE SIMULATION, rien ne sera écrit' : ''}\n`);

  const publies: string[] = [];
  const retires: { nom: string; manques: string[] }[] = [];
  const enAttente = new Map<string, number>();
  let inchanges = 0;

  for (const p of produits) {
    const verdict = deciderStatut(p as unknown as FicheProduit, p.status as StatutProduit);
    const nom = `${p.brand.name} — ${p.name}`;

    if (verdict.nouveau === null) {
      inchanges += 1;
      if (p.status === 'DRAFT') {
        for (const m of verdict.manques) enAttente.set(m, (enAttente.get(m) ?? 0) + 1);
      }
      continue;
    }

    if (!simuler) {
      await prisma.product.update({ where: { id: p.id }, data: { status: verdict.nouveau } });
    }
    if (verdict.nouveau === 'ACTIVE') publies.push(nom);
    else retires.push({ nom, manques: verdict.manques });
  }

  console.log(`  Publiés  : ${publies.length}`);
  for (const n of publies.slice(0, 15)) console.log(`    + ${n}`);
  if (publies.length > 15) console.log(`    … et ${publies.length - 15} autres`);

  console.log(`\n  Retirés  : ${retires.length}`);
  for (const r of retires.slice(0, 15)) console.log(`    − ${r.nom}  (${r.manques.join(', ')})`);
  if (retires.length > 15) console.log(`    … et ${retires.length - 15} autres`);

  console.log(`\n  Inchangés : ${inchanges}`);
  if (enAttente.size > 0) {
    console.log('  Brouillons en attente, par manque :');
    for (const [m, n] of [...enAttente].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(5)}  ${m}`);
    }
  }

  const apres = simuler
    ? null
    : await prisma.product.groupBy({ by: ['status'], _count: true });
  if (apres) {
    console.log(`\n  Statuts après passage : ${apres.map((s) => `${s.status}=${s._count}`).join(', ')}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('\nPublication interrompue :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
