import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route } from '@/lib/api-response';

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
