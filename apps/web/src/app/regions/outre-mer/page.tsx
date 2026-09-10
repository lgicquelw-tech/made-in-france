import { prisma } from '@/lib/db';
import OverseasList, { type Brand, type RegionCount } from './overseas-list';

/**
 * Marques d'outre-mer — **Server Component** (REBUILD.md T4.3, T4.7).
 *
 * La page faisait cinq appels HTTP séquentiels — un par territoire — à chaque
 * changement de page ou de filtre. Une seule requête suffit.
 */

export const revalidate = 3600;

const OVERSEAS_SLUGS = [
  'guadeloupe',
  'martinique',
  'guyane',
  'la-reunion',
  'mayotte',
  'polynesie-francaise',
  'nouvelle-caledonie',
];

export default async function OverseasPage() {
  const regions = await prisma.region.findMany({
    where: { slug: { in: OVERSEAS_SLUGS } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, _count: { select: { brands: true } } },
  });

  const rows = await prisma.brand.findMany({
    where: { regionId: { in: regions.map((r) => r.id) } },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      descriptionShort: true,
      logoUrl: true,
      websiteUrl: true,
      city: true,
      region: { select: { name: true } },
      sector: { select: { name: true, color: true } },
    },
  });

  const allBrands = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.descriptionShort,
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    city: row.city,
    region: row.region?.name ?? null,
    sector: row.sector?.name ?? null,
    sectorColor: row.sector?.color ?? null,
  })) as unknown as Brand[];

  const regionCounts: RegionCount[] = regions.map((r) => ({
    slug: r.slug,
    name: r.name,
    count: r._count.brands,
  }));

  return <OverseasList allBrands={allBrands} regionCounts={regionCounts} />;
}
