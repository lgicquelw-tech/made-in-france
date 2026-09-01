import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /a-propos (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  title: 'À propos',
  description: "Pourquoi ce projet, comment les marques sont référencées, et d'où viennent les informations publiées.",
  alternates: { canonical: `${siteUrl()}/a-propos` },
  openGraph: {
    type: 'website',
    title: `À propos | Made in France`,
    description: "Pourquoi ce projet, comment les marques sont référencées, et d'où viennent les informations publiées.",
    url: `${siteUrl()}/a-propos`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
