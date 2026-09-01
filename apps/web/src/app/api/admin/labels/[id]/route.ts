import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/guards';
import { route, badRequest, notFound } from '@/lib/api-response';
import { labelUpdateSchema } from '@/lib/validation/label';

/** Modification et suppression d'un label. Migré depuis Express. */

type Context = { params: { id: string } };

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const input = labelUpdateSchema.parse(await request.json());

  const existing = await prisma.label.findUnique({ where: { id: params.id } });
  if (!existing) throw notFound('Label introuvable');

  if (input.slug && input.slug !== existing.slug) {
    const taken = await prisma.label.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (taken) throw badRequest(`Le slug « ${input.slug} » est déjà utilisé.`);
  }

  const data: Prisma.LabelUpdateInput = {};
  (['name', 'slug', 'description', 'logoUrl', 'websiteUrl'] as const).forEach((key) => {
    if (input[key] !== undefined) {
      (data as Record<string, unknown>)[key] = input[key];
    }
  });

  const label = await prisma.label.update({ where: { id: params.id }, data });

  return NextResponse.json({ data: label });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  // Supprimer un label le détache de toutes les marques et de tous les
  // produits qui le portent : c'est irréversible et à large portée.
  await requireSuperAdmin();

  const label = await prisma.label.findUnique({
    where: { id: params.id },
    include: { _count: { select: { brands: true, products: true } } },
  });
  if (!label) throw notFound('Label introuvable');

  // Une transaction : sans elle, un échec entre les trois suppressions
  // laissait des associations orphelines pointant un label disparu.
  await prisma.$transaction([
    prisma.brandLabel.deleteMany({ where: { labelId: params.id } }),
    prisma.productLabel.deleteMany({ where: { labelId: params.id } }),
    prisma.label.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({
    success: true,
    deletedRelations: { brands: label._count.brands, products: label._count.products },
  });
});
