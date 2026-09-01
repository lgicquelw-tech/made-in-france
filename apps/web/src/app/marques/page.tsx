import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import BrandList, {
  type Brand,
  type Pagination,
  type Region,
  type Sector,
} from './brand-list';

/**
 * Annuaire des marques — **Server Component** (REBUILD.md T4.1, T4.7, T4.8).
 *
 * La page chargeait tout dans des `useEffect` : le HTML servi ne contenait ni
 * marque, ni total, ni filtre. Elle rend désormais la première page côté
 * serveur ; le composant de liste garde ses filtres.
 */

export const revalidate = 3600;

const PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const total = await prisma.brand.count();
  const title = 'Toutes les marques';
  const description = `${total} marques françaises référencées : mode, maison, gastronomie, cosmétique, sport et plus. Trouvez qui fabrique en France, et où.`;
  const url = `${siteUrl()}/marques`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${title} | Made in France`,
      description,
      url,
      siteName: 'Made in France',
      locale: 'fr_FR',
    },
  };
}

export default async function BrandsPage() {
  const [rows, total, regionRows, sectorRows] = await Promise.all([
    prisma.brand.findMany({
      take: PAGE_SIZE,
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
        sector: { select: { name: true, slug: true, color: true } },
      },
    }),
    prisma.brand.count(),
    prisma.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
    prisma.sector.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
  ]);

  // Mise à plat identique à celle que renvoyait l'API, pour que le composant
  // de liste reçoive la même forme d'un côté comme de l'autre.
  const initialBrands: Brand[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.descriptionShort,
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    city: row.city,
    region: row.region?.name ?? null,
    sector: row.sector?.name ?? null,
    sectorSlug: row.sector?.slug ?? null,
    sectorColor: row.sector?.color ?? null,
  }));

  const initialPagination: Pagination = {
    page: 1,
    limit: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };

  return (
    <BrandList
      initialBrands={initialBrands}
      initialPagination={initialPagination}
      regions={regionRows as Region[]}
      sectors={sectorRows as Sector[]}
    />
  );
}
