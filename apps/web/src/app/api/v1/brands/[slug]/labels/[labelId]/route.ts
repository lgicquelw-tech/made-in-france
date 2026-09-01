import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Retrait d'un label d'une marque, par son propriétaire. */

type Context = { params: { slug: string; labelId: string } };

export const DELETE = route<Context>(async (_request, { params }) => {
  const { brand } = await requireBrandOwner(params.slug);

  const association = await prisma.brandLabel.findUnique({
    where: { brandId_labelId: { brandId: brand.id, labelId: params.labelId } },
    select: { brandId: true },
  });
  if (!association) throw notFound('Ce label n’est pas associé à cette marque.');

  await prisma.brandLabel.delete({
    where: { brandId_labelId: { brandId: brand.id, labelId: params.labelId } },
  });

  return NextResponse.json({ success: true });
});
