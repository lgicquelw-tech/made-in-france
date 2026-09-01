import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest } from '@/lib/api-response';
import { labelCreateSchema } from '@/lib/validation/label';

/** Liste et création des labels. Migré depuis Express, désormais authentifié. */

export const GET = route(async () => {
  await requireAdmin();

  const labels = await prisma.label.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { brands: true, products: true } } },
  });

  return NextResponse.json({
    data: labels.map((label) => ({
      ...label,
      brandsCount: label._count.brands,
      productsCount: label._count.products,
    })),
  });
});

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const input = labelCreateSchema.parse(await request.json());

  const existing = await prisma.label.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) throw badRequest(`Le slug « ${input.slug} » est déjà utilisé.`);

  const label = await prisma.label.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
    },
  });

  return NextResponse.json({ data: label }, { status: 201 });
});
