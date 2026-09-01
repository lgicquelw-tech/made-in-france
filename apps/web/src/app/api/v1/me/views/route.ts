import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

/**
 * Enregistre la consultation d'une fiche marque par l'utilisateur connecté.
 *
 * ⚠️ L'ancienne route prenait l'identifiant dans l'URL et accordait un point
 * à chaque appel, sans aucune limite : n'importe qui pouvait fabriquer des
 * points, pour lui ou pour autrui. Un point n'est désormais accordé que pour
 * une **première** consultation de la marque.
 */

const viewSchema = z.object({
  brandId: z.string().uuid('Identifiant de marque invalide'),
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const { brandId } = viewSchema.parse(await request.json());

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const alreadySeen = await prisma.brandView.findFirst({
    where: { userId: user.id, brandId },
    select: { id: true },
  });

  await prisma.brandView.create({ data: { userId: user.id, brandId } });

  if (alreadySeen) {
    return NextResponse.json({ message: 'Vue enregistrée', pointsEarned: 0 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { points: { increment: 1 } },
  });

  return NextResponse.json({ message: 'Vue enregistrée', pointsEarned: 1 });
});
