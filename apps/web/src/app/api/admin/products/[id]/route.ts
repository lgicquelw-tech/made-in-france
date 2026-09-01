import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { productUpdateSchema } from '@/lib/validation/product';

/** Consultation, modification et suppression d'un produit. Migré depuis Express. */

type Context = { params: { id: string } };

export const GET = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, brand: true },
  });
  if (!product) throw notFound('Produit introuvable');

  return NextResponse.json({ data: product });
});

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const input = productUpdateSchema.parse(await request.json());

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) throw notFound('Produit introuvable');

  // Comme pour les marques : on n'ecrit que les champs envoyes. L'ancienne
  // route faisait `galleryUrls: data.galleryUrls || []`, `materials: ... || []`,
  // `tags: ... || []` et `attributes: ... || {}` — une mise a jour partielle
  // effacait la galerie, les matieres, les tags et les attributs.
  const data: Prisma.ProductUpdateInput = {};
  (
    [
      'name',
      'slug',
      'descriptionShort',
      'descriptionLong',
      'imageUrl',
      'galleryUrls',
      'priceMin',
      'priceMax',
      'currency',
      'manufacturingLocation',
      'materials',
      'externalBuyUrl',
      'affiliateUrl',
      'tags',
      'attributes',
      'status',
      'isFeatured',
    ] as const
  ).forEach((key) => {
    if (input[key] !== undefined) {
      (data as Record<string, unknown>)[key] = input[key];
    }
  });

  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });

  return NextResponse.json({ data: product });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!product) throw notFound('Produit introuvable');

  await prisma.product.delete({ where: { id: params.id } });

  return NextResponse.json({ message: `Produit « ${product.name} » supprimé` });
});
