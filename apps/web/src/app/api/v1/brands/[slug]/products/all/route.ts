import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Tous les produits d'une marque, brouillons compris — la liste du Studio.
 * Sur Express cette route était **publique** : n'importe qui voyait les produits non
 * publiés de n'importe quelle marque. Elle exige désormais la propriété (règle 1).
 */
type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const { brand } = await requireBrandOwner(params.slug);
  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, name: true, slug: true, descriptionShort: true, imageUrl: true, galleryUrls: true,
      priceMin: true, priceMax: true, currency: true, externalBuyUrl: true, buyUrlDeadAt: true,
      status: true, isFeatured: true, collectedAt: true, externalSource: true,
    },
  });
  return NextResponse.json({ data: products });
});
