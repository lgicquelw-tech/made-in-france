import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import BrandProducts, { type Brand, type Product } from './brand-products';
import { OU_MARQUE_ACCESSIBLE } from '@/lib/marque-publique';

/**
 * Produits d'une marque — **Server Component** (REBUILD.md T4.4, T4.7).
 *
 * Les métadonnées vivent dans `layout.tsx`, qui nomme la marque.
 */

export const revalidate = 3600;
export const dynamicParams = true;

export default async function BrandProductsPage({ params }: { params: { slug: string } }) {
  const brand = await prisma.brand.findFirst({
    where: { slug: params.slug, ...OU_MARQUE_ACCESSIBLE },
    select: { id: true, name: true, slug: true, sector: { select: { color: true } } },
  });
  // La page affichait auparavant « Marque non trouvée » avec un code 200 :
  // un moteur indexait donc une page d'erreur comme une page valide.
  if (!brand) notFound();

  const rows = await prisma.product.findMany({
    where: { brandId: brand.id, status: 'ACTIVE' },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
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
      category: { select: { name: true } },
    },
  });

  const products: Product[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.descriptionShort,
    imageUrl: row.imageUrl,
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    currency: row.currency,
    buyUrl: row.externalBuyUrl,
    category: row.category?.name ?? null,
    isFeatured: row.isFeatured,
  }));

  return <BrandProducts brand={brand as Brand} products={products} />;
}
