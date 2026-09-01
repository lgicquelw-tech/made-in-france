import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { brandUpdateSchema } from '@/lib/validation/brand';

/**
 * Consultation, modification et suppression d'une marque (administration).
 *
 * Migré depuis Express, où `DELETE /api/admin/brands/:id` était accessible
 * sans aucune authentification : une requête suffisait à effacer une fiche et,
 * en cascade, ses produits, ses images et ses propriétaires.
 */

type Context = { params: { id: string } };

export const GET = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: {
      region: true,
      sector: true,
      labels: { include: { label: true } },
    },
  });

  if (!brand) throw notFound('Marque introuvable');

  return NextResponse.json({ data: brand });
});

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const input = brandUpdateSchema.parse(await request.json());

  // On ne écrit QUE les champs réellement envoyés. L'ancienne route Express
  // faisait `galleryUrls: data.galleryUrls || []` : une mise à jour partielle
  // vidait la galerie et les réseaux sociaux sans rien signaler.
  const data: Prisma.BrandUpdateInput = {};
  const assign = <K extends keyof typeof input>(key: K) => {
    if (input[key] !== undefined) {
      (data as Record<string, unknown>)[key as string] = input[key];
    }
  };

  (
    [
      'name',
      'slug',
      'descriptionShort',
      'descriptionLong',
      'story',
      'logoUrl',
      'coverImageUrl',
      'galleryUrls',
      'videoUrl',
      'websiteUrl',
      'city',
      'address',
      'postalCode',
      'latitude',
      'longitude',
      'yearFounded',
      'socialLinks',
      'aiGeneratedContent',
      'status',
      'isFeatured',
      'isVerified',
    ] as const
  ).forEach(assign);

  // Les relations passent par `connect` / `disconnect`, pas par un id brut.
  if (input.sectorId !== undefined) {
    data.sector = input.sectorId ? { connect: { id: input.sectorId } } : { disconnect: true };
  }
  if (input.regionId !== undefined) {
    data.region = input.regionId ? { connect: { id: input.regionId } } : { disconnect: true };
  }

  const existing = await prisma.brand.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) throw notFound('Marque introuvable');

  const brand = await prisma.brand.update({
    where: { id: params.id },
    data,
    include: { region: true, sector: true },
  });

  return NextResponse.json({ data: brand });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  // Suppression irréversible : elle emporte en cascade les produits, les
  // images, les propriétaires et les demandes de revendication de la marque.
  // Réservée au super-administrateur.
  await requireSuperAdmin();

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  await prisma.brand.delete({ where: { id: params.id } });

  return NextResponse.json({ message: `Marque « ${brand.name} » supprimée` });
});
