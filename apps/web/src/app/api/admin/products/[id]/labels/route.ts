import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest, notFound } from '@/lib/api-response';
import { labelLinkSchema } from '@/lib/validation/label';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Association d'un label à un produit. Migré depuis Express. */

type Context = { params: { id: string } };

export const POST = route<Context>(async (request, { params }) => {
  await requireAdmin();

  const { labelId } = labelLinkSchema.parse(await request.json());

  const [product, label] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id }, select: { id: true } }),
    prisma.label.findUnique({ where: { id: labelId }, select: { id: true } }),
  ]);

  if (!product) throw notFound('Produit introuvable');
  if (!label) throw notFound('Label introuvable');

  const existing = await prisma.productLabel.findUnique({
    where: { productId_labelId: { productId: params.id, labelId } },
    select: { productId: true },
  });
  if (existing) throw badRequest('Ce label est déjà associé au produit.');

  await prisma.productLabel.create({ data: { productId: params.id, labelId } });

  return NextResponse.json({ success: true }, { status: 201 });
});
