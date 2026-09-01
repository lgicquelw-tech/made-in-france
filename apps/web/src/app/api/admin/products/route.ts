import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest, notFound } from '@/lib/api-response';
import { slugify } from '@/lib/utils';
import { productCreateSchema, productListQuerySchema } from '@/lib/validation/product';

/**
 * Liste et création des produits (administration).
 *
 * ⚠️ Le `GET` **n'existait nulle part** : la page `/admin/produits` l'appelait,
 * recevait une 404, et retombait sur cinq produits ecrits en dur en affichant
 * « 39 835 produits ». C'est de la que venait ce chiffre, repris ensuite par
 * PLAN.md — il ne provenait d'aucun comptage en base.
 */

export const GET = route(async (request: Request) => {
  await requireAdmin();

  const url = new URL(request.url);
  const { page, limit, search, status, sector } = productListQuerySchema.parse(
    Object.fromEntries(url.searchParams)
  );

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { brand: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(sector ? { brand: { sector: { slug: sector } } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        brand: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const input = productCreateSchema.parse(await request.json());

  const brand = await prisma.brand.findUnique({
    where: { id: input.brandId },
    select: { id: true },
  });
  // L'ancienne route passait brandId directement a Prisma : une marque
  // inconnue produisait une 500 illisible.
  if (!brand) throw notFound('Marque introuvable');

  const slug = input.slug ?? slugify(input.name);

  // Le slug n'est unique que PAR MARQUE (@@unique([brandId, slug])).
  const existing = await prisma.product.findUnique({
    where: { brandId_slug: { brandId: input.brandId, slug } },
    select: { id: true },
  });
  if (existing) {
    throw badRequest(`Cette marque a déjà un produit avec le slug « ${slug} ».`);
  }

  const product = await prisma.product.create({
    data: {
      brandId: input.brandId,
      name: input.name,
      slug,
      descriptionShort: input.descriptionShort ?? null,
      descriptionLong: input.descriptionLong ?? null,
      imageUrl: input.imageUrl ?? null,
      galleryUrls: input.galleryUrls ?? [],
      categoryId: input.categoryId ?? null,
      priceMin: input.priceMin ?? null,
      priceMax: input.priceMax ?? null,
      currency: input.currency ?? 'EUR',
      manufacturingLocation: input.manufacturingLocation ?? null,
      materials: input.materials ?? [],
      externalBuyUrl: input.externalBuyUrl ?? null,
      affiliateUrl: input.affiliateUrl ?? null,
      tags: input.tags ?? [],
      attributes: (input.attributes ?? {}) as Prisma.InputJsonValue,
      status: input.status ?? 'ACTIVE',
      isFeatured: input.isFeatured ?? false,
    },
    include: { category: true },
  });

  return NextResponse.json({ data: product }, { status: 201 });
});
