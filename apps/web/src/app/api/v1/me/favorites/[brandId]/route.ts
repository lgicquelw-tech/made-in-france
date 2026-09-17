import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Un favori précis de l'utilisateur connecté. */

type Context = { params: { brandId: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const user = await requireUser();

  const favorite = await prisma.favorite.findUnique({
    where: { userId_brandId: { userId: user.id, brandId: params.brandId } },
    select: { id: true },
  });

  return NextResponse.json({ isFavorite: favorite !== null });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  const user = await requireUser();

  const favorite = await prisma.favorite.findUnique({
    where: { userId_brandId: { userId: user.id, brandId: params.brandId } },
    select: { id: true },
  });

  // Retirer un favori absent n'est pas une erreur : le resultat voulu est
  // atteint. On repond 200 sans rien faire.
  if (!favorite) return NextResponse.json({ success: true, removed: false });

  await prisma.favorite.delete({ where: { id: favorite.id } });

  return NextResponse.json({ success: true, removed: true });
});
