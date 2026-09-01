import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /recherche (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  title: 'Rechercher une marque ou un produit',
  description: 'Cherchez parmi les marques et les produits fabriqués en France, par nom, ville ou secteur.',
  alternates: { canonical: `${siteUrl()}/recherche` },
  openGraph: {
    type: 'website',
    title: `Rechercher une marque ou un produit | Made in France`,
    description: 'Cherchez parmi les marques et les produits fabriqués en France, par nom, ville ou secteur.',
    url: `${siteUrl()}/recherche`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
