import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route, badRequest } from '@/lib/api-response';
import { slugify } from '@/lib/utils';
import { brandInputSchema, brandListQuerySchema } from '@/lib/validation/brand';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Liste et création des marques côté administration.
 *
 * Migré depuis `apps/api/src/index.ts` (Express), où ces deux routes étaient
 * **ouvertes à tout le monde** — aucun middleware d'authentification n'existait
 * (constat n°1). Elles sont désormais derrière `requireAdmin`, qui relit le
 * rôle en base à chaque appel.
 */

export const GET = route(async (request: Request) => {
  await requireAdmin();

  const url = new URL(request.url);
  const { page, limit, search } = brandListQuerySchema.parse(
    Object.fromEntries(url.searchParams)
  );

  const where: Prisma.BrandWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      include: { region: true, sector: true },
    }),
    prisma.brand.count({ where }),
  ]);

  return NextResponse.json({
    data: brands,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = route(async (request: Request) => {
  const acteur = await requireAdmin();

  const input = brandInputSchema.parse(await request.json());
  const slug = input.slug ?? slugify(input.name);

  // Le slug est la clé publique de la fiche : on refuse explicitement le
  // doublon plutôt que de laisser remonter une erreur Prisma en 500.
  const existing = await prisma.brand.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    throw badRequest(`Une marque utilise déjà le slug « ${slug} ».`);
  }

  const brand = await prisma.$transaction(async (tx) => {
      const creee = await tx.brand.create({
      data: {
        name: input.name,
        slug,
        descriptionShort: input.descriptionShort ?? null,
        descriptionLong: input.descriptionLong ?? null,
        story: input.story ?? null,
        logoUrl: input.logoUrl ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        galleryUrls: input.galleryUrls ?? [],
        videoUrl: input.videoUrl ?? null,
        websiteUrl: input.websiteUrl ?? null,
        city: input.city ?? null,
        address: input.address ?? null,
        postalCode: input.postalCode ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        yearFounded: input.yearFounded ?? null,
        sectorId: input.sectorId ?? null,
        regionId: input.regionId ?? null,
        socialLinks: input.socialLinks ?? {},
        aiGeneratedContent: (input.aiGeneratedContent ?? {}) as Prisma.InputJsonValue,
        status: input.status ?? 'ACTIVE',
        isFeatured: input.isFeatured ?? false,
        isVerified: input.isVerified ?? false,
      },
      include: { region: true, sector: true },
      });
    await journaliser(tx, { acteur, action: 'brand.create', cible: { type: 'brand', id: creee.id, libelle: creee.name }, avant: null, apres: creee });
    return creee;
  });


  return NextResponse.json({ data: brand }, { status: 201 });
});
