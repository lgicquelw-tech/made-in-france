import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /carte (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  title: 'Carte des marques françaises',
  description: 'Où fabrique-t-on en France ? Explorez les marques françaises sur une carte, région par région.',
  alternates: { canonical: `${siteUrl()}/carte` },
  openGraph: {
    type: 'website',
    title: `Carte des marques françaises | Made in France`,
    description: 'Où fabrique-t-on en France ? Explorez les marques françaises sur une carte, région par région.',
    url: `${siteUrl()}/carte`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
