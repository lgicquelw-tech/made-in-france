import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { featuredUpdateSchema } from '@/lib/validation/collection';

/** Modification et suppression d'une mise en avant. Migré depuis Express. */

type Context = { params: { id: string } };

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const input = featuredUpdateSchema.parse(await request.json());

  const existing = await prisma.featuredBrand.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) throw notFound('Mise en avant introuvable');

  // L'ancienne route faisait `startDate: new Date(data.startDate)` sans
  // condition : une mise a jour partielle sans dates produisait deux
  // « Invalid Date » et une 500.
  const data: Prisma.FeaturedBrandUpdateInput = {};
  (
    ['title', 'description', 'imageUrl', 'featuredType', 'isActive', 'startDate', 'endDate', 'displayOrder'] as const
  ).forEach((key) => {
    if (input[key] !== undefined) {
      (data as Record<string, unknown>)[key] = input[key];
    }
  });

  if (input.brandId !== undefined) {
    const brand = await prisma.brand.findUnique({
      where: { id: input.brandId },
      select: { id: true },
    });
    if (!brand) throw notFound('Marque introuvable');
    data.brand = { connect: { id: input.brandId } };
  }

  const featured = await prisma.featuredBrand.update({
    where: { id: params.id },
    data,
    include: { brand: true },
  });

  return NextResponse.json({ data: featured });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const existing = await prisma.featuredBrand.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) throw notFound('Mise en avant introuvable');

  await prisma.featuredBrand.delete({ where: { id: params.id } });

  return NextResponse.json({ message: 'Mise en avant supprimée' });
});
