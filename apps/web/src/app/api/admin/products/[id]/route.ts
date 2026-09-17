import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route, notFound } from '@/lib/api-response';
import { productUpdateSchema } from '@/lib/validation/product';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

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
  const acteur = await requireAdmin();

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

  const avant = await prisma.product.findUnique({ where: { id: params.id } });
  if (!avant) throw notFound('Produit introuvable');

  const product = await prisma.$transaction(async (tx) => {
    const apres = await tx.product.update({ where: { id: params.id }, data, include: { category: true } });
    await journaliser(tx, { acteur, action: 'product.update', cible: { type: 'product', id: apres.id, libelle: apres.name }, avant, apres });
    return apres;
  });

  return NextResponse.json({ data: product });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  const acteur = await requireAdmin();

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) throw notFound('Produit introuvable');

  await prisma.$transaction(async (tx) => {
    await tx.product.delete({ where: { id: params.id } });
    await journaliser(tx, { acteur, action: 'product.delete', cible: { type: 'product', id: product.id, libelle: product.name }, avant: product, apres: null });
  });

  return NextResponse.json({ message: `Produit « ${product.name} » supprimé` });
});
