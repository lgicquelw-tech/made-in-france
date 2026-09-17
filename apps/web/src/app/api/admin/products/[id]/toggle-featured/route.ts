import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route, notFound } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Bascule la mise en avant d'un produit. Migré depuis Express. */

type Context = { params: { id: string } };

export const PUT = route<Context>(async (_request, { params }) => {
  const acteur = await requireAdmin();

  const product = await prisma.product.findUnique({ where: { id: params.id }, select: { isFeatured: true, name: true } });
  if (!product) throw notFound('Produit introuvable');

  const updated = await prisma.$transaction(async (tx) => {
    const apres = await tx.product.update({
      where: { id: params.id },
      data: { isFeatured: !product.isFeatured },
      include: { brand: { include: { sector: true } } },
    });
    await journaliser(tx, {
      acteur, action: 'product.update', cible: { type: 'product', id: params.id, libelle: product.name },
      changements: { isFeatured: { avant: product.isFeatured, apres: apres.isFeatured } },
    });
    return apres;
  });

  return NextResponse.json({
    data: updated,
    message: updated.isFeatured
      ? 'Produit ajouté aux tendances'
      : 'Produit retiré des tendances',
  });
});
