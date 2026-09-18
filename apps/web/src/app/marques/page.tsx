import { Suspense } from 'react';
import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import { JsonLd, breadcrumbList, itemList } from '@/lib/json-ld';
import { OU_MARQUE_PUBLIQUE } from '@/lib/marque-publique';
import BrandList, {
  type Brand,
  type Pagination,
  type Region,
  type Sector,
} from './brand-list';

/**
 * ⚠️ `useSearchParams()` impose une frontiere `Suspense` des lors que la page
 * est prerendue : sans elle, `next build` echoue avec
 * « useSearchParams() should be wrapped in a suspense boundary ».
 *
 * Le mode developpement ne le signale pas. Ce defaut existait depuis le commit
 * de fevrier 2026 : le projet n'etait donc pas constructible, et par
 * consequent pas deployable.
 */

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
  const total = await prisma.brand.count({ where: OU_MARQUE_PUBLIQUE });
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
      where: OU_MARQUE_PUBLIQUE,
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
    prisma.brand.count({ where: OU_MARQUE_PUBLIQUE }),
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

  // La liste ne rend que sa premiere page : c'est elle qu'on decrit, pas les
  // 903 fiches. Annoncer plus que ce que la page contient serait faux.
  const structured = itemList('Toutes les marques', initialBrands.map((b) => ({
    name: b.name,
    path: `/marques/${b.slug}`,
  })));
  const crumbs = breadcrumbList([{ name: 'Marques', path: '/marques' }]);

  return (
    <>
      <JsonLd data={structured} />
      <JsonLd data={crumbs} />
      <Suspense fallback={<div className="p-12 text-center text-gray-500">Chargement des marques…</div>}>
        <BrandList
          initialBrands={initialBrands}
          initialPagination={initialPagination}
          regions={regionRows as Region[]}
          sectors={sectorRows as Sector[]}
        />
      </Suspense>
    </>
  );
}
