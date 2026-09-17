import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { journaliser } from '@/lib/audit';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

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

/**
 * Suppression du compte connecté (RGPD, art. 17) — immédiate, définitive, sans passer
 * par nous. La cascade emporte favoris, historique de consultation, connexions Google,
 * sessions et droits sur des marques ; les demandes de revendication restent, détachées
 * du compte (`userId` remis à null), car elles documentent une décision éditoriale sur la
 * marque, pas sur la personne — et les coordonnées qu'elles portent sont effacées.
 *
 * La trace d'audit garde l'identifiant opaque et la date, **pas l'e-mail** : une preuve
 * qu'une suppression a eu lieu, sans conserver ce qu'on vient d'effacer.
 */
export const DELETE = route(async () => {
  const authed = await requireUser();

  await prisma.$transaction(async (tx) => {
    await tx.brandClaimRequest.updateMany({
      where: { userId: authed.id },
      data: { userId: null, email: 'compte-supprime', firstName: '—', lastName: '—', phone: null },
    });
    await tx.user.delete({ where: { id: authed.id } });
    await journaliser(tx, {
      acteur: null,
      action: 'user.delete',
      cible: { type: 'user', id: authed.id },
      changements: { compte: { avant: 'actif', apres: 'supprimé à la demande de la personne' } },
    });
  });

  return NextResponse.json({ success: true });
});
