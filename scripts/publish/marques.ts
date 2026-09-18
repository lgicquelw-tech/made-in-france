#!/usr/bin/env tsx
/**
 * Validation des marques au seuil de complétude — `pnpm data:publish:brands`.
 *
 * Applique `marques-policy.ts` à toutes les marques, écrit le statut qui en découle et
 * laisse une ligne d'audit par marque validée (`brand.publish`, sans acteur : la décision
 * est celle du propriétaire, consignée dans `REBUILD.md`). Idempotent.
 *
 * Options :
 *   --simuler    n'écrit rien : annonce ce qui serait fait
 */
import { PrismaClient } from '@prisma/client';
import { deciderStatutMarque, type StatutMarque } from './marques-policy';
import type { FicheMarque } from '../audit/checks';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const simuler = process.argv.includes('--simuler');

  const marques = await prisma.brand.findMany({
    select: {
      id: true, name: true, slug: true, status: true,
      descriptionShort: true, sectorId: true, regionId: true, websiteUrl: true, logoUrl: true, coverImageUrl: true,
      galleryUrls: true, city: true, latitude: true, longitude: true, descriptionLong: true, yearFounded: true, socialLinks: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('\nValidation des marques au seuil de complétude');
  console.log('─'.repeat(78));
  console.log(`  ${marques.length} marques examinées${simuler ? ' — MODE SIMULATION, rien ne sera écrit' : ''}\n`);

  const validees: string[] = [];
  const enAttente: { nom: string; slug: string; manques: string[] }[] = [];
  let inchangees = 0;

  for (const m of marques) {
    const verdict = deciderStatutMarque(m as FicheMarque, m.status as StatutMarque);
    if (verdict.nouveau === null) {
      if (m.status === 'PENDING_REVIEW') enAttente.push({ nom: m.name, slug: m.slug, manques: verdict.manques });
      else inchangees += 1;
      continue;
    }

    if (!simuler) {
      await prisma.$transaction([
        prisma.brand.update({ where: { id: m.id }, data: { status: verdict.nouveau } }),
        prisma.auditLog.create({ data: {
          action: 'brand.publish', targetType: 'brand', targetId: m.id, targetLabel: m.name,
          changes: { status: { avant: m.status, apres: verdict.nouveau }, decision: { avant: null, apres: 'validation en bloc des fiches complètes — décision du propriétaire, 18 septembre 2026' } },
        } }),
      ]);
    }
    validees.push(m.name);
  }

  console.log(`  Validées : ${validees.length}`);
  for (const n of validees.slice(0, 8)) console.log(`    ✓ ${n}`);
  if (validees.length > 8) console.log(`    … et ${validees.length - 8} autres`);

  console.log(`\n  Restent en attente : ${enAttente.length}`);
  for (const e of enAttente) console.log(`    · ${e.nom} (/${e.slug}) — ${e.manques.join(' ; ')}`);

  console.log(`\n  Inchangées (déjà décidées) : ${inchangees}`);

  const parStatut = await prisma.brand.groupBy({ by: ['status'], _count: { _all: true } });
  console.log(`\n  Statuts après passage : ${parStatut.map((s) => `${s.status}=${s._count._all}`).join(', ')}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
