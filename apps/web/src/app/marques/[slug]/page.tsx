import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import BrandDetail, { type Brand, type BrandProduct, type SimilarBrand } from './brand-detail';

/**
 * Fiche marque — **Server Component** (REBUILD.md T4.2, T4.7, T4.8, T4.9, T4.11).
 *
 * Cette page était entièrement `'use client'` et chargeait la marque dans un
 * `useEffect` : le HTML servi ne contenait qu'un « Chargement… ». Aucun titre,
 * aucune description, aucun contenu. Pour un annuaire dont le référencement
 * est le canal d'acquisition, chaque fiche était invisible.
 *
 * Elle lit désormais la base directement — pas d'aller-retour HTTP — et
 * transmet les données au composant de rendu, qui reste client pour ses
 * interactions.
 */

// Régénération horaire : les fiches changent peu, et 903 pages statiques
// coûteraient cher à rebâtir à chaque déploiement.
export const revalidate = 3600;
export const dynamicParams = true;

async function getBrand(slug: string) {
  return prisma.brand.findUnique({
    where: { slug },
    include: {
      region: { select: { id: true, name: true, slug: true } },
      sector: { select: { id: true, name: true, slug: true, color: true } },
      labels: { include: { label: { select: { id: true, name: true, slug: true } } } },
    },
  });
}

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({ select: { slug: true } });
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const brand = await getBrand(params.slug);
  if (!brand) return { title: 'Marque introuvable' };

  // Le layout applique déjà le gabarit `%s | Made in France` : ajouter le
  // suffixe ici le ferait apparaître deux fois.
  const title = `${brand.name}${brand.city ? ` — ${brand.city}` : ''}`;
  const description =
    brand.descriptionShort ??
    brand.tagline ??
    `${brand.name}, marque française${brand.sector ? ` du secteur ${brand.sector.name}` : ''}${
      brand.city ? `, basée à ${brand.city}` : ''
    }.`;
  const url = `${siteUrl()}/marques/${brand.slug}`;
  const image = brand.coverImageUrl ?? brand.logoUrl ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      // Open Graph n'applique pas le gabarit du layout : le suffixe est explicite.
      title: `${title} | Made in France`,
      description,
      url,
      siteName: 'Made in France',
      locale: 'fr_FR',
      images: image ? [{ url: image, alt: brand.name }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} | Made in France`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await getBrand(params.slug);
  if (!brand) notFound();

  const [products, similar] = await Promise.all([
    prisma.product.findMany({
      where: { brandId: brand.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        priceMin: true,
        priceMax: true,
        externalBuyUrl: true,
      },
    }),
    brand.sectorId
      ? prisma.brand.findMany({
          where: { sectorId: brand.sectorId, id: { not: brand.id } },
          take: 3,
          select: {
            id: true,
            name: true,
            slug: true,
            descriptionShort: true,
            city: true,
            region: { select: { name: true } },
            sector: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const similarBrands: SimilarBrand[] = similar.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.descriptionShort,
    city: b.city,
    region: b.region?.name ?? null,
    sector: b.sector?.name ?? null,
  }));

  // JSON-LD `Organization` (T4.11) : il dit à un moteur ce qu'est cette page,
  // au lieu de le lui laisser deviner à partir du texte.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: `${siteUrl()}/marques/${brand.slug}`,
    ...(brand.descriptionShort ? { description: brand.descriptionShort } : {}),
    ...(brand.logoUrl ? { logo: brand.logoUrl } : {}),
    ...(brand.websiteUrl ? { sameAs: [brand.websiteUrl] } : {}),
    ...(brand.yearFounded ? { foundingDate: String(brand.yearFounded) } : {}),
    ...(brand.city
      ? {
          address: {
            '@type': 'PostalAddress',
            addressLocality: brand.city,
            ...(brand.postalCode ? { postalCode: brand.postalCode } : {}),
            addressCountry: 'FR',
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
      <BrandDetail
        brand={brand as unknown as Brand}
        similarBrands={similarBrands}
        products={products as BrandProduct[]}
      />
    </>
  );
}
