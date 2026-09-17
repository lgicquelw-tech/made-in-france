import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { route } from '@/lib/api-response';

/**
 * Recherche de marque pour la **revendication** (Studio). Sur Express, elle filtrait
 * `status: 'ACTIVE'` : avec 902 marques en `PENDING_REVIEW`, une marque cherchant sa
 * propre fiche ne la trouvait pas. La revendication porte sur la propriété, pas sur la
 * publication — toutes les marques sont cherchables.
 */
const parametres = z.object({
  q: z.string().trim().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export const GET = route(async (request: Request) => {
  const { q, limit } = parametres.parse(Object.fromEntries(new URL(request.url).searchParams));
  if (!q) return NextResponse.json({ data: [] });

  const brands = await prisma.brand.findMany({
    where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }] },
    select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true, city: true, sector: { select: { name: true, color: true } } },
    take: limit,
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: brands });
});
