import { prisma } from '@/lib/db';
import RegionsGrid, { type RegionWithCount } from './regions-grid';

/**
 * Liste des régions — **Server Component** (REBUILD.md T4.3, T4.7).
 *
 * Les métadonnées vivent dans `layout.tsx` : cette page en avait besoin avant
 * de devenir un Server Component, et le layout les porte toujours pour
 * `/regions/[slug]`.
 */

export const revalidate = 3600;

export default async function RegionsPage() {
  const rows = await prisma.region.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, _count: { select: { brands: true } } },
  });

  const regions: RegionWithCount[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    brandCount: row._count.brands,
  }));

  return <RegionsGrid regions={regions} />;
}
