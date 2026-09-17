import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Retrait d'une marque d'une collection. Migré depuis Express. */

type Context = { params: { id: string; brandId: string } };

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const link = await prisma.collectionBrand.findUnique({
    where: {
      collectionId_brandId: { collectionId: params.id, brandId: params.brandId },
    },
    select: { collectionId: true },
  });
  if (!link) throw notFound("Cette marque n'est pas dans la collection.");

  await prisma.collectionBrand.delete({
    where: {
      collectionId_brandId: { collectionId: params.id, brandId: params.brandId },
    },
  });

  return NextResponse.json({ message: 'Marque retirée de la collection' });
});
