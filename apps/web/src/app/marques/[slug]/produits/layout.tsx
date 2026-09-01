import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de la liste de produits d'une marque (REBUILD.md T4.8).
 *
 * La page est `'use client'` : c'est ce layout qui porte le titre. Il est
 * dynamique — un layout reçoit `params` comme une page.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  if (!brand) return { title: 'Marque introuvable' };

  const title = `Produits de ${brand.name}`;
  const description = `${brand._count.products} produit${
    brand._count.products > 1 ? 's' : ''
  } fabriqué${brand._count.products > 1 ? 's' : ''} en France par ${brand.name}.`;
  const url = `${siteUrl()}/marques/${brand.slug}/produits`;

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

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
