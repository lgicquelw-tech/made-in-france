import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { route, notFound } from '@/lib/api-response';

/** Les labels d'un produit (REBUILD.md T3.8). */
type Context = { params: { id: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const id = z.string().uuid().parse(params.id);
  const product = await prisma.product.findUnique({
    where: { id },
    select: { labels: { select: { label: true } } },
  });
  if (!product) throw notFound('Produit introuvable');
  return NextResponse.json({ data: product.labels.map((l) => l.label) });
});
