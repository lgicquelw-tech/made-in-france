import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /regions (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  // ⚠️ Un `title` en chaine simple dans un layout imbrique REMPLACE le
  // gabarit du layout racine pour tout son sous-arbre : /regions/bretagne
  // perdait alors son suffixe. On redeclare donc le gabarit ici.
  title: {
    default: 'Marques par région',
    template: '%s | Made in France',
  },
  description: 'Découvrez les marques françaises région par région : Bretagne, Normandie, Auvergne-Rhône-Alpes et toutes les autres.',
  alternates: { canonical: `${siteUrl()}/regions` },
  openGraph: {
    type: 'website',
    title: `Marques par région | Made in France`,
    description: 'Découvrez les marques françaises région par région : Bretagne, Normandie, Auvergne-Rhône-Alpes et toutes les autres.',
    url: `${siteUrl()}/regions`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
