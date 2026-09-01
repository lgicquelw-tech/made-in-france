import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /regions/outre-mer (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  title: "Marques d'outre-mer",
  description: "Les marques qui fabriquent dans les territoires français d'outre-mer.",
  alternates: { canonical: `${siteUrl()}/regions/outre-mer` },
  openGraph: {
    type: 'website',
    title: `Marques d'outre-mer | Made in France`,
    description: "Les marques qui fabriquent dans les territoires français d'outre-mer.",
    url: `${siteUrl()}/regions/outre-mer`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
