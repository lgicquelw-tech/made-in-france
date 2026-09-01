import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { collectionUpdateSchema } from '@/lib/validation/collection';

/** Modification et suppression d'une collection. Migré depuis Express. */

type Context = { params: { id: string } };

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const input = collectionUpdateSchema.parse(await request.json());

  const existing = await prisma.collection.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) throw notFound('Collection introuvable');

  // L'ancienne route faisait `startDate: data.startDate ? new Date(...) : null` :
  // une mise a jour partielle effacait les deux dates.
  const data: Prisma.CollectionUpdateInput = {};
  (
    ['name', 'slug', 'description', 'imageUrl', 'color', 'isActive', 'startDate', 'endDate', 'displayOrder'] as const
  ).forEach((key) => {
    if (input[key] !== undefined) {
      (data as Record<string, unknown>)[key] = input[key];
    }
  });

  const collection = await prisma.collection.update({ where: { id: params.id }, data });

  return NextResponse.json({ data: collection });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!collection) throw notFound('Collection introuvable');

  await prisma.collection.delete({ where: { id: params.id } });

  return NextResponse.json({ message: `Collection « ${collection.name} » supprimée` });
});
