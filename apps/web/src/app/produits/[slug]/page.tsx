import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import ProductDetail, {
  type Product,
  type SimilarProduct,
} from './product-detail';

/**
 * Fiche produit — **Server Component** (REBUILD.md T4.4, T4.7, T4.8, T4.11).
 *
 * Même défaut que la fiche marque : le produit était chargé dans un
 * `useEffect`, donc absent du HTML servi.
 */

/**
 * Un champ `Json` peut contenir un tableau… ou une chaîne contenant un
 * tableau. Le seed encodait `materials` et `tags` en chaîne : la page plantait
 * sur `product.materials.join is not a function`. Corrigé à la source, mais
 * les scrapers peuvent reproduire le défaut — on normalise ici aussi.
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

export const revalidate = 3600;
export const dynamicParams = true;

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      websiteUrl: true,
      city: true,
      region: { select: { name: true } },
      sector: { select: { name: true, slug: true, color: true } },
    },
  },
} as const;

async function getProduct(slug: string) {
  // Le slug n'est unique que par marque (@@unique([brandId, slug])) : deux
  // marques peuvent avoir un « t-shirt-blanc ». On prend le plus récent
  // publié, comme le faisait l'API.
  return prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: PRODUCT_INCLUDE,
  });
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
    distinct: ['slug'],
  });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produit introuvable' };

  const title = `${product.name} — ${product.brand.name}`;
  const description =
    product.descriptionShort ??
    `${product.name}, fabriqué en France par ${product.brand.name}${
      product.brand.city ? ` à ${product.brand.city}` : ''
    }.`;
  const url = `${siteUrl()}/produits/${product.slug}`;

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
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const similar = await prisma.product.findMany({
    where: { brandId: product.brandId, status: 'ACTIVE', id: { not: product.id } },
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      priceMin: true,
      priceMax: true,
    },
  });

  // JSON-LD `Product` (T4.11). L'offre n'est déclarée que si le prix ET le
  // lien d'achat existent : annoncer un prix sans moyen d'acheter serait
  // signalé comme une donnée structurée invalide.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `${siteUrl()}/produits/${product.slug}`,
    ...(product.descriptionShort ? { description: product.descriptionShort } : {}),
    ...(product.imageUrl ? { image: product.imageUrl } : {}),
    brand: { '@type': 'Brand', name: product.brand.name },
    ...(product.priceMin && product.externalBuyUrl
      ? {
          offers: {
            '@type': 'Offer',
            price: product.priceMin,
            priceCurrency: product.currency || 'EUR',
            url: product.externalBuyUrl,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail
        product={
          {
            ...product,
            materials: toStringArray(product.materials),
            tags: toStringArray(product.tags),
            galleryUrls: toStringArray(product.galleryUrls),
          } as unknown as Product
        }
        similarProducts={similar as SimilarProduct[]}
      />
    </>
  );
}
