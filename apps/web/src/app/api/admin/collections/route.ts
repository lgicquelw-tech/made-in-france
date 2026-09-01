import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route, badRequest } from '@/lib/api-response';
import { slugify } from '@/lib/utils';
import { collectionCreateSchema } from '@/lib/validation/collection';

/** Liste et création des collections. Migré depuis Express. */

export const GET = route(async () => {
  await requireAdmin();

  const collections = await prisma.collection.findMany({
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { brands: true } } },
  });

  return NextResponse.json({ data: collections });
});

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const input = collectionCreateSchema.parse(await request.json());
  const slug = input.slug ?? slugify(input.name);

  const existing = await prisma.collection.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) throw badRequest(`Le slug « ${slug} » est déjà utilisé.`);

  const collection = await prisma.collection.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      color: input.color ?? null,
      isActive: input.isActive ?? true,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  return NextResponse.json({ data: collection }, { status: 201 });
});
