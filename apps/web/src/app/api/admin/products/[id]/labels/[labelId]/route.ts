import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Détachement d'un label d'un produit. Migré depuis Express. */

type Context = { params: { id: string; labelId: string } };

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const association = await prisma.productLabel.findUnique({
    where: { productId_labelId: { productId: params.id, labelId: params.labelId } },
    select: { productId: true },
  });

  // L'ancienne route appelait `delete` a l'aveugle : une association absente
  // remontait en 500 au lieu d'une 404.
  if (!association) throw notFound('Ce label n’est pas associé à ce produit.');

  await prisma.productLabel.delete({
    where: { productId_labelId: { productId: params.id, labelId: params.labelId } },
  });

  return NextResponse.json({ success: true });
});
