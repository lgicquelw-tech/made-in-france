import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Détachement d'un label d'une marque (administration). Migré depuis Express. */

type Context = { params: { id: string; labelId: string } };

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const association = await prisma.brandLabel.findUnique({
    where: { brandId_labelId: { brandId: params.id, labelId: params.labelId } },
    select: { brandId: true },
  });

  // L'ancienne route appelait `delete` sans verifier : une association absente
  // remontait en 500 au lieu d'une 404.
  if (!association) throw notFound('Ce label n’est pas associé à cette marque.');

  await prisma.brandLabel.delete({
    where: { brandId_labelId: { brandId: params.id, labelId: params.labelId } },
  });

  return NextResponse.json({ success: true });
});
