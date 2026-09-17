import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route, notFound } from '@/lib/api-response';
import { brandDashboardUpdateSchema } from '@/lib/validation/brand-dashboard';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Tableau de bord d'une marque, côté propriétaire.
 *
 * ⚠️ L'ancienne route acceptait `?userId=` comme preuve d'identité : il
 * suffisait de deviner un identifiant pour lire **et modifier** n'importe
 * quelle fiche (constat n°3). `requireBrandOwner` vérifie la propriété en
 * base, et exclut le rôle `VIEWER` en écriture.
 */

type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const { brand } = await requireBrandOwner(params.slug);

  const full = await prisma.brand.findUnique({
    where: { id: brand.id },
    include: {
      sector: true,
      region: true,
      labels: { include: { label: true } },
      images: { select: { id: true, url: true, isPrimary: true } },
    },
  });
  if (!full) throw notFound('Marque introuvable');

  const [productCount, favoriteCount] = await Promise.all([
    prisma.product.count({ where: { brandId: brand.id, status: 'ACTIVE' } }),
    prisma.favorite.count({ where: { brandId: brand.id } }),
  ]);

  return NextResponse.json({
    brand: {
      id: full.id,
      name: full.name,
      slug: full.slug,
      description: full.descriptionShort,
      descriptionLong: full.descriptionLong,
      story: full.story,
      logoUrl: full.logoUrl,
      coverImageUrl: full.coverImageUrl,
      websiteUrl: full.websiteUrl,
      address: full.address,
      postalCode: full.postalCode,
      city: full.city,
      sector: full.sector,
      region: full.region,
      labels: full.labels.map((l) => l.label),
      socialLinks: full.socialLinks,
      photos: full.images,
      createdAt: full.createdAt,
      updatedAt: full.updatedAt,
    },
    stats: {
      // Seuls chiffres réels aujourd'hui : ils viennent de la base.
      favorites: favoriteCount,
      products: productCount,
      // `null`, et non un nombre : ces trois mesures étaient generées au
      // `Math.random()` et affichées à la marque comme si elles étaient
      // vraies (constat n°15). Elles demandent de vrais événements — T8.2.
      views: null,
      clicks: null,
      conversionRate: null,
    },
  });
});

export const PUT = route<Context>(async (request, { params }) => {
  const { user, brand } = await requireBrandOwner(params.slug);

  const input = brandDashboardUpdateSchema.parse(await request.json());

  const data: Prisma.BrandUpdateInput = {};
  (Object.keys(input) as Array<keyof typeof input>).forEach((key) => {
    if (input[key] !== undefined && key !== 'sectorId' && key !== 'regionId') {
      (data as Record<string, unknown>)[key as string] = input[key];
    }
  });

  if (input.sectorId !== undefined) {
    data.sector = input.sectorId ? { connect: { id: input.sectorId } } : { disconnect: true };
  }
  if (input.regionId !== undefined) {
    data.region = input.regionId ? { connect: { id: input.regionId } } : { disconnect: true };
  }

  const avant = await prisma.brand.findUnique({ where: { id: brand.id } });
  const updated = await prisma.$transaction(async (tx) => {
    const apres = await tx.brand.update({ where: { id: brand.id }, data });
    await journaliser(tx, { acteur: user, action: 'brand.update', cible: { type: 'brand', id: apres.id, libelle: apres.name }, avant, apres });
    return apres;
  });

  return NextResponse.json({ success: true, brand: updated });
});
