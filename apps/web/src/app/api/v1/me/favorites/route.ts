import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/** Favoris de l'utilisateur connecté. Remplace `/api/v1/users/:userId/favorites`. */

const addFavoriteSchema = z.object({
  brandId: z.string().uuid('Identifiant de marque invalide'),
});

const POINTS_PER_FAVORITE = 5;

export const GET = route(async () => {
  const user = await requireUser();

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { brand: { include: { region: true, sector: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    data: favorites.map((fav) => ({
      id: fav.id,
      brandId: fav.brandId,
      createdAt: fav.createdAt,
      brand: {
        id: fav.brand.id,
        name: fav.brand.name,
        slug: fav.brand.slug,
        description: fav.brand.descriptionShort,
        logoUrl: fav.brand.logoUrl,
        websiteUrl: fav.brand.websiteUrl,
        city: fav.brand.city,
        region: fav.brand.region?.name ?? null,
        sector: fav.brand.sector?.name ?? null,
      },
    })),
  });
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const { brandId } = addFavoriteSchema.parse(await request.json());

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const existing = await prisma.favorite.findUnique({
    where: { userId_brandId: { userId: user.id, brandId } },
    select: { id: true },
  });

  if (existing) {
    // L'ancienne route incrementait les points a CHAQUE appel, meme quand le
    // favori existait deja. C'est corrige.
    // ⚠️ Mais le compte reste gonflable : retirer puis remettre en favori
    // rapporte 5 points a chaque cycle, faute d'un registre des points deja
    // accordes. La correction complete demande une table dediee, plus une
    // limitation de debit (T3.21). Consigne, pas resolu.
    return NextResponse.json({ data: { id: existing.id, brandId }, alreadyFavorite: true });
  }

  const [favorite] = await prisma.$transaction([
    prisma.favorite.create({ data: { userId: user.id, brandId } }),
    prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: POINTS_PER_FAVORITE } },
    }),
  ]);

  return NextResponse.json(
    { data: { id: favorite.id, brandId }, pointsEarned: POINTS_PER_FAVORITE },
    { status: 201 }
  );
});
