import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest, notFound } from '@/lib/api-response';
import { collectionBrandsSchema } from '@/lib/validation/collection';

/** Ajout de marques à une collection. Migré depuis Express. */

type Context = { params: { id: string } };

export const POST = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const { brandIds } = collectionBrandsSchema.parse(await request.json());

  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!collection) throw notFound('Collection introuvable');

  // L'ancienne route inserait les identifiants sans les verifier : une marque
  // inconnue faisait echouer tout le lot avec une 500 illisible.
  const found = await prisma.brand.findMany({
    where: { id: { in: brandIds } },
    select: { id: true },
  });
  if (found.length !== brandIds.length) {
    const known = new Set(found.map((b) => b.id));
    const missing = brandIds.filter((id) => !known.has(id));
    throw badRequest(`Marque(s) introuvable(s) : ${missing.join(', ')}`);
  }

  const result = await prisma.collectionBrand.createMany({
    data: brandIds.map((brandId, index) => ({
      collectionId: params.id,
      brandId,
      displayOrder: index,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({
    message: `${result.count} marque(s) ajoutée(s) à la collection`,
    added: result.count,
  });
});
