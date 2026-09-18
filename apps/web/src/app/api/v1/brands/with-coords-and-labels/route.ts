import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route } from '@/lib/api-response';
import { OU_MARQUE_PUBLIQUE } from '@/lib/marque-publique';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Les marques géolocalisées, pour la carte. 868 sur 903 depuis T5.4. */
export const GET = route(async () => {
  const brands = await prisma.brand.findMany({
    where: { ...OU_MARQUE_PUBLIQUE, latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, name: true, slug: true, descriptionShort: true, city: true, websiteUrl: true, latitude: true, longitude: true,
      region: { select: { name: true } },
      sector: { select: { name: true, slug: true, color: true } },
      labels: { select: { label: { select: { name: true } } } },
    },
  });
  return NextResponse.json({
    data: brands.map((b) => ({
      id: b.id, name: b.name, slug: b.slug, description: b.descriptionShort, city: b.city,
      region: b.region?.name ?? null, websiteUrl: b.websiteUrl, latitude: b.latitude, longitude: b.longitude,
      labels: b.labels.map((l) => l.label.name),
      sector: b.sector?.name ?? null, sectorSlug: b.sector?.slug ?? null, sectorColor: b.sector?.color ?? '#002395',
    })),
    total: brands.length,
  });
});
