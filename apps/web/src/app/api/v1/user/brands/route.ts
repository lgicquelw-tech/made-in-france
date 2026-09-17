import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Marques dont l'utilisateur connecté est propriétaire.
 *
 * ⚠️ L'ancienne route prenait un `?email=` en clair : n'importe qui pouvait
 * énumérer les marques détenues par n'importe quelle adresse. C'était à la
 * fois une faille d'autorisation et une fuite d'information.
 */
export const GET = route(async () => {
  const user = await requireUser();

  const memberships = await prisma.brandOwner.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      brand: {
        select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true },
      },
    },
  });

  return NextResponse.json({
    brands: memberships.map((m) => ({ ...m.brand, role: m.role })),
  });
});
