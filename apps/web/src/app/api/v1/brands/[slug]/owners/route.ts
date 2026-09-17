import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, forbidden } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Propriétaires d'une marque. Migré depuis Express (`?userId=` supprimé). */

type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const { user, brand } = await requireBrandOwner(params.slug);

  // Voir qui d'autre a accès à la marque est réservé à OWNER et ADMIN.
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    const membership = await prisma.brandOwner.findUnique({
      where: { brandId_userId: { brandId: brand.id, userId: user.id } },
      select: { role: true },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw forbidden('Seuls les propriétaires et administrateurs de la marque voient cette liste.');
    }
  }

  const owners = await prisma.brandOwner.findMany({
    where: { brandId: brand.id, isActive: true },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({
    owners: owners.map((o) => ({
      id: o.id,
      role: o.role,
      acceptedAt: o.acceptedAt,
      user: o.user,
    })),
  });
});
