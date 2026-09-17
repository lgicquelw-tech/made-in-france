import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Publie en masse les produits encore en brouillon. Migré depuis Express.
 *
 * Deux corrections par rapport à l'original :
 *
 * 1. Il filtrait sur `status: 'INACTIVE'`, un statut **qui n'existe pas** dans
 *    l'énumération (`DRAFT`, `ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`) : la
 *    route ne faisait donc rien du tout. Elle ne touche que `DRAFT` — ni
 *    `OUT_OF_STOCK` (un fait de stock) ni `DISCONTINUED` (un retrait voulu).
 * 2. `requireSuperAdmin` : publier d'un coup l'intégralité du catalogue est
 *    une action à large portée, et elle contredit frontalement T5.8 (ne
 *    publier que ce qui passe l'audit de qualité). À reconsidérer en phase 5.
 */
export const POST = route(async () => {
  const acteur = await requireSuperAdmin();

  const result = await prisma.$transaction(async (tx) => {
    const r = await tx.product.updateMany({ where: { status: 'DRAFT' }, data: { status: 'ACTIVE' } });
    // Une action en masse : une seule ligne, avec le nombre — pas une par produit.
    await journaliser(tx, {
      acteur, action: 'product.activate-all', cible: { type: 'product', id: '*', libelle: `${r.count} produit(s)` },
      changements: { status: { avant: 'DRAFT', apres: 'ACTIVE' }, count: { avant: null, apres: r.count } },
    });
    return r;
  });

  return NextResponse.json({
    success: true,
    count: result.count,
    message: `${result.count} produit(s) rendus visibles`,
  });
});
