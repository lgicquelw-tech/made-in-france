import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route, notFound } from '@/lib/api-response';

/** Images d'une marque. Lecture publique — elles sont déjà affichées sur la fiche. */

type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const images = await prisma.brandImage.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: images });
});
