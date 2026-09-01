import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, badRequest, forbidden, notFound } from '@/lib/api-response';
import { labelLinkSchema } from '@/lib/validation/label';

/** Labels d'une marque. Lecture publique, écriture réservée au propriétaire. */

type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    include: { labels: { include: { label: true } } },
  });
  if (!brand) throw notFound('Marque introuvable');

  return NextResponse.json({ data: brand.labels.map((bl) => bl.label) });
});

export const POST = route<Context>(async (request, { params }) => {
  // ⚠️ L'ancienne route ne verifiait RIEN : n'importe qui pouvait attacher
  // un label a n'importe quelle marque. Elle ne controlait que le palier
  // d'abonnement — pas l'identite de l'appelant.
  const { brand } = await requireBrandOwner(params.slug);

  const { labelId } = labelLinkSchema.parse(await request.json());

  const [full, label] = await Promise.all([
    prisma.brand.findUnique({
      where: { id: brand.id },
      select: { subscriptionTier: true },
    }),
    prisma.label.findUnique({ where: { id: labelId }, select: { id: true } }),
  ]);

  if (!label) throw notFound('Label introuvable');
  if (full?.subscriptionTier === 'FREE') {
    throw forbidden('Les labels demandent un abonnement Premium ou Royale.');
  }

  const existing = await prisma.brandLabel.findUnique({
    where: { brandId_labelId: { brandId: brand.id, labelId } },
    select: { brandId: true },
  });
  if (existing) throw badRequest('Ce label est déjà associé à la marque.');

  await prisma.brandLabel.create({ data: { brandId: brand.id, labelId } });

  return NextResponse.json({ success: true }, { status: 201 });
});
