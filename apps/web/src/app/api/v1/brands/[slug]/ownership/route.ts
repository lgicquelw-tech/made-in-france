import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { route, notFound } from '@/lib/api-response';

/**
 * L'utilisateur connecté est-il propriétaire de cette marque ?
 *
 * ⚠️ L'ancienne route lisait `?userId=` : n'importe qui pouvait demander
 * « suis-je propriétaire ? » au nom de n'importe qui (constat n°3).
 * L'identité vient désormais de la session, jamais du client.
 */

type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) return NextResponse.json({ isOwner: false, role: null });

  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const ownership = await prisma.brandOwner.findUnique({
    where: { brandId_userId: { brandId: brand.id, userId } },
    select: { role: true, isActive: true, acceptedAt: true },
  });

  if (ownership?.isActive && ownership.acceptedAt) {
    return NextResponse.json({ isOwner: true, role: ownership.role });
  }

  return NextResponse.json({ isOwner: false, role: null });
});
