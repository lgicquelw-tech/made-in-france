import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import ProductList, { type Product, type Sector } from './product-list';

/**
 * Catalogue produit — **Server Component** (REBUILD.md T4.4, T4.7, T4.8).
 */

export const revalidate = 3600;

const PAGE_SIZE = 24;

export async function generateMetadata(): Promise<Metadata> {
  const total = await prisma.product.count({ where: { status: 'ACTIVE' } });
  const title = 'Produits fabriqués en France';
  const description =
    total > 0
      ? `${total} produits fabriqués en France, par secteur, prix et marque.`
      : 'Produits fabriqués en France, par secteur, prix et marque.';
  const url = `${siteUrl()}/produits`;

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

export default async function ProductsPage() {
  const [rows, total, sectorRows] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        priceMin: true,
        priceMax: true,
        brand: {
          select: { name: true, slug: true, sector: { select: { color: true } } },
        },
      },
    }),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.sector.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        _count: { select: { brands: true } },
      },
    }),
  ]);

  return (
    <ProductList
      initialProducts={rows as unknown as Product[]}
      initialTotal={total}
      sectors={sectorRows as Sector[]}
    />
  );
}
