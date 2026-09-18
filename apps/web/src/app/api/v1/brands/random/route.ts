import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route, notFound } from '@/lib/api-response';
import { OU_MARQUE_PUBLIQUE } from '@/lib/marque-publique';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Une marque au hasard — la suggestion de la page des favoris. */
export const GET = route(async () => {
  const count = await prisma.brand.count({ where: OU_MARQUE_PUBLIQUE });
  if (count === 0) throw notFound('Aucune marque');
  const brand = await prisma.brand.findFirst({
    where: OU_MARQUE_PUBLIQUE,
    skip: Math.floor(Math.random() * count),
    select: {
      id: true, name: true, slug: true, descriptionShort: true, logoUrl: true, websiteUrl: true, city: true,
      region: { select: { name: true } }, sector: { select: { name: true, slug: true, color: true } },
    },
  });
  if (!brand) throw notFound('Aucune marque');
  return NextResponse.json({ data: {
    id: brand.id, name: brand.name, slug: brand.slug, description: brand.descriptionShort,
    logoUrl: brand.logoUrl, websiteUrl: brand.websiteUrl, city: brand.city,
    region: brand.region?.name ?? null, sector: brand.sector?.name ?? null,
    sectorSlug: brand.sector?.slug ?? null, sectorColor: brand.sector?.color ?? null,
  } });
});
