import type { Metadata } from 'next';

import { siteUrl } from '@/lib/site';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { lireChiffres } from '@/lib/chiffres';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  // Sans `metadataBase`, Next.js ne peut pas rendre absolues les URL des
  // images Open Graph, et avertit a chaque rendu.
  metadataBase: new URL(siteUrl()),
  alternates: { canonical: '/' },
  title: {
    default: 'Made in France - Découvrez les marques françaises',
    template: '%s | Made in France',
  },
  description:
    'Plateforme de découverte des marques et produits fabriqués en France. Trouvez des alternatives Made in France grâce à notre moteur de recherche intelligent.',
  keywords: [
    'Made in France',
    'marques françaises',
    'fabriqué en France',
    'produits français',
    'artisanat français',
    'acheter français',
  ],
  authors: [{ name: 'Le P\'tit Studio' }],
  creator: 'Le P\'tit Studio',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://madeinfrance.fr',
    siteName: 'Made in France',
    title: 'Made in France - Découvrez les marques françaises',
    description:
      'Plateforme de découverte des marques et produits fabriqués en France.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Made in France',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Made in France - Découvrez les marques françaises',
    description:
      'Plateforme de découverte des marques et produits fabriqués en France.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Les compteurs du pied de page viennent de la base (cache d'une heure), plus jamais
  // d'une constante : « 5000+ produits » s'affichait pendant que la base en servait 35 000.
  const chiffres = await lireChiffres();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <LayoutWrapper chiffres={chiffres}>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}