import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

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
  await requireSuperAdmin();

  const result = await prisma.product.updateMany({
    where: { status: 'DRAFT' },
    data: { status: 'ACTIVE' },
  });

  return NextResponse.json({
    success: true,
    count: result.count,
    message: `${result.count} produit(s) rendus visibles`,
  });
});
