import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Métadonnées de /entreprises (REBUILD.md T4.8).
 *
 * La page est `'use client'` — elle ne peut donc pas exporter `metadata`
 * elle-même. C'est le rôle de ce layout : il permet de donner un titre, une
 * description et une canonique à une page interactive, sans la réécrire.
 */
export const metadata: Metadata = {
  title: 'Vous êtes une marque française ?',
  description: 'Revendiquez votre fiche, complétez vos informations et faites connaître votre fabrication française.',
  alternates: { canonical: `${siteUrl()}/entreprises` },
  openGraph: {
    type: 'website',
    title: `Vous êtes une marque française ? | Made in France`,
    description: 'Revendiquez votre fiche, complétez vos informations et faites connaître votre fabrication française.',
    url: `${siteUrl()}/entreprises`,
    siteName: 'Made in France',
    locale: 'fr_FR',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
