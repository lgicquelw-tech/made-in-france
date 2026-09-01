import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Produits d'une marque (administration). Migré depuis Express. */

type Context = { params: { id: string } };

export const GET = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const products = await prisma.product.findMany({
    where: { brandId: params.id },
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  });

  return NextResponse.json({ data: products });
});
