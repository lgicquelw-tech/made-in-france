import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest, notFound } from '@/lib/api-response';

/** Labels associés à une marque (administration). Migré depuis Express. */

type Context = { params: { id: string } };

const attachLabelSchema = z.object({
  labelId: z.string().uuid('Identifiant de label invalide'),
});

export const GET = route<Context>(async (_request, { params }) => {
  await requireAdmin();

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    include: { labels: { include: { label: true } } },
  });
  if (!brand) throw notFound('Marque introuvable');

  return NextResponse.json({ data: brand.labels.map((bl) => bl.label) });
});

export const POST = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const { labelId } = attachLabelSchema.parse(await request.json());

  const [brand, label] = await Promise.all([
    prisma.brand.findUnique({ where: { id: params.id }, select: { id: true } }),
    // L'ancienne route ne verifiait pas l'existence du label : un identifiant
    // inconnu produisait une 500 au lieu d'une erreur comprehensible.
    prisma.label.findUnique({ where: { id: labelId }, select: { id: true } }),
  ]);

  if (!brand) throw notFound('Marque introuvable');
  if (!label) throw notFound('Label introuvable');

  const existing = await prisma.brandLabel.findUnique({
    where: { brandId_labelId: { brandId: params.id, labelId } },
    select: { brandId: true },
  });
  if (existing) throw badRequest('Ce label est déjà associé à la marque.');

  await prisma.brandLabel.create({ data: { brandId: params.id, labelId } });

  return NextResponse.json({ success: true }, { status: 201 });
});
