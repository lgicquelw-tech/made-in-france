import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Marques et produits qui portent un label. Migré depuis Express. */

type Context = { params: { id: string } };

export const GET = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const label = await prisma.label.findUnique({
    where: { id: params.id },
    include: {
      brands: {
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true, subscriptionTier: true },
          },
        },
      },
      products: {
        include: { product: { select: { id: true, name: true, slug: true } } },
        take: 50,
      },
      _count: { select: { brands: true, products: true } },
    },
  });

  if (!label) throw notFound('Label introuvable');

  return NextResponse.json({
    data: {
      label: { id: label.id, name: label.name, slug: label.slug },
      brands: label.brands.map((bl) => bl.brand),
      products: label.products.map((pl) => pl.product),
      // L'ancienne route renvoyait `label.products.length`, or la liste est
      // tronquee a 50 : le total affiche etait donc faux au-dela de 50.
      totalBrands: label._count.brands,
      totalProducts: label._count.products,
    },
  });
});
