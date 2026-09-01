import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { featuredCreateSchema } from '@/lib/validation/collection';

/** Liste et création des mises en avant de marque. Migré depuis Express. */

export const GET = route(async () => {
  await requireAdmin();

  const featured = await prisma.featuredBrand.findMany({
    orderBy: [{ featuredType: 'asc' }, { displayOrder: 'asc' }],
    include: { brand: { include: { region: true, sector: true } } },
  });

  return NextResponse.json({ data: featured });
});

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const input = featuredCreateSchema.parse(await request.json());

  const brand = await prisma.brand.findUnique({
    where: { id: input.brandId },
    select: { id: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  const featured = await prisma.featuredBrand.create({
    data: {
      brandId: input.brandId,
      title: input.title ?? null,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      featuredType: input.featuredType ?? 'weekly',
      isActive: input.isActive ?? true,
      startDate: input.startDate,
      endDate: input.endDate,
      displayOrder: input.displayOrder ?? 0,
    },
    include: { brand: true },
  });

  return NextResponse.json({ data: featured }, { status: 201 });
});
