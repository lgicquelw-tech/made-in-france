import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/**
 * Profil de l'utilisateur connecté.
 *
 * ⚠️ Remplace `GET /api/v1/users/:userId`, où l'identifiant venait de l'URL :
 * n'importe qui pouvait lire le profil et l'adresse e-mail de n'importe qui.
 * L'identité vient désormais de la session — d'où le chemin `/me`, qui rend
 * la chose impossible à exprimer autrement.
 */
export const GET = route(async () => {
  const authed = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: authed.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      rank: true,
      role: true,
      createdAt: true,
      _count: { select: { favorites: true, brandViews: true } },
    },
  });
  if (!user) throw notFound('Utilisateur introuvable');

  return NextResponse.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      points: user.points,
      rank: user.rank,
      role: user.role,
      favoritesCount: user._count.favorites,
      viewsCount: user._count.brandViews,
      createdAt: user.createdAt,
    },
  });
});
