import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import RegionDetail, { type Brand, type Pagination } from './region-detail';

/** Marques d'une région — Server Component (REBUILD.md T4.3, T4.8). */

export const revalidate = 3600;
export const dynamicParams = true;

const PAGE_SIZE = 12;

async function getRegion(slug: string) {
  return prisma.region.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } });
}

export async function generateStaticParams() {
  const regions = await prisma.region.findMany({ select: { slug: true } });
  return regions.map((region) => ({ slug: region.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const region = await getRegion(params.slug);
  if (!region) return { title: 'Région introuvable' };

  const count = await prisma.brand.count({ where: { regionId: region.id } });
  const title = `Marques de ${region.name}`;
  const description = `${count} marque${count > 1 ? 's' : ''} française${count > 1 ? 's' : ''} fabriquant en ${region.name}.`;
  const url = `${siteUrl()}/regions/${region.slug}`;

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

export default async function RegionPage({ params }: { params: { slug: string } }) {
  const region = await getRegion(params.slug);
  // Une région inconnue affichait auparavant une page vide sous un nom
  // reconstruit à partir du slug. Elle renvoie désormais 404.
  if (!region) notFound();

  const [rows, total] = await Promise.all([
    prisma.brand.findMany({
      where: { regionId: region.id },
      take: PAGE_SIZE,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionShort: true,
        logoUrl: true,
        city: true,
        region: { select: { name: true } },
        sector: { select: { name: true, color: true } },
      },
    }),
    prisma.brand.count({ where: { regionId: region.id } }),
  ]);

  const initialBrands = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.descriptionShort,
    logoUrl: row.logoUrl,
    city: row.city,
    region: row.region?.name ?? null,
    sector: row.sector?.name ?? null,
    sectorColor: row.sector?.color ?? null,
  })) as unknown as Brand[];

  const initialPagination: Pagination = {
    page: 1,
    limit: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };

  return (
    <RegionDetail
      slug={region.slug}
      regionName={region.name}
      initialBrands={initialBrands}
      initialPagination={initialPagination}
    />
  );
}
