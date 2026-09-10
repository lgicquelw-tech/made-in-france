import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import HomeContent, {
  type HomeCollection,
  type Sector,
  type TrendingProduct,
  type WeeklyBrand,
} from './home-content';

/**
 * Page d'accueil — **Server Component** (REBUILD.md T4.7).
 *
 * La vitrine du site chargeait ses quatre sections par quatre `useEffect`
 * distincts. Le HTML servi ne contenait donc ni marque à l'affiche, ni
 * produit, ni secteur : un moteur ne voyait qu'une page de squelettes.
 */

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const [brands, sectors] = await Promise.all([
    prisma.brand.count(),
    prisma.sector.count(),
  ]);

  return {
    title: {
      absolute: 'Made in France — Découvrez les marques françaises',
    },
    description: `${brands} marques françaises référencées dans ${sectors} secteurs. Trouvez qui fabrique en France, et où.`,
    alternates: { canonical: siteUrl() },
    openGraph: {
      type: 'website',
      title: 'Made in France — Découvrez les marques françaises',
      description: `${brands} marques françaises référencées dans ${sectors} secteurs.`,
      url: siteUrl(),
      siteName: 'Made in France',
      locale: 'fr_FR',
    },
  };
}

export default async function HomePage() {
  const now = new Date();

  const [featured, trending, sectorRows, collectionRows] = await Promise.all([
    prisma.brand.findMany({
      where: { isFeatured: true },
      take: 3,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionShort: true,
        city: true,
        yearFounded: true,
        websiteUrl: true,
        region: { select: { name: true } },
        sector: { select: { name: true, slug: true, color: true } },
        labels: { select: { label: { select: { name: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { status: 'ACTIVE', isFeatured: true },
      take: 8,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionShort: true,
        imageUrl: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        externalBuyUrl: true,
        isFeatured: true,
        brand: {
          select: { id: true, name: true, slug: true, sector: { select: { color: true } } },
        },
      },
    }),
    prisma.sector.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        icon: true,
        _count: { select: { brands: true } },
      },
    }),
    prisma.collection.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, slug: true, _count: { select: { brands: true } } },
    }),
  ]);

  // Mise à plat identique à celle que renvoyaient les routes de l'API, pour
  // que le composant reçoive la même forme des deux côtés.
  const featuredBrands: WeeklyBrand[] = featured.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.descriptionShort,
    city: b.city,
    yearFounded: b.yearFounded,
    region: b.region?.name ?? null,
    sector: b.sector?.name ?? null,
    sectorSlug: b.sector?.slug ?? null,
    sectorColor: b.sector?.color ?? null,
    websiteUrl: b.websiteUrl,
    labels: b.labels.map((l) => l.label.name),
  }));

  const trendingProducts: TrendingProduct[] = trending.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.descriptionShort,
    imageUrl: p.imageUrl,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    currency: p.currency,
    buyUrl: p.externalBuyUrl,
    isFeatured: p.isFeatured,
    brand: {
      id: p.brand.id,
      name: p.brand.name,
      slug: p.brand.slug,
      sectorColor: p.brand.sector?.color ?? '#002395',
    },
  }));

  const sectors: Sector[] = sectorRows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    color: s.color,
    icon: s.icon,
    brandCount: s._count.brands,
  }));

  const collections: HomeCollection[] = collectionRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    brandCount: c._count.brands,
  }));

  return (
    <HomeContent
      featuredBrands={featuredBrands}
      trendingProducts={trendingProducts}
      sectors={sectors}
      collections={collections}
    />
  );
}
