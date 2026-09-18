import type { Metadata } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import HomeContent, { type MarqueMiseEnAvant, type SecteurAccueil } from './home-content';
import { lireFil, parametresFil } from '@/lib/feed';
import { OU_MARQUE_PUBLIQUE } from '@/lib/marque-publique';

/**
 * Page d'accueil — **Server Component** (REBUILD.md T4.7).
 *
 * La vitrine du site chargeait ses quatre sections par quatre `useEffect`
 * distincts. Le HTML servi ne contenait donc ni marque à l'affiche, ni
 * produit, ni secteur : un moteur ne voyait qu'une page de squelettes.
 */

// Rendu **à la requête**, pas au build. L'accueil montre le catalogue du moment : avec
// `revalidate = 1800`, Next le prérendait au build et servait trente minutes une page
// figée — vide, en CI, puisque la base du build l'était (17 septembre 2026). Quatre
// requêtes légères par visite, c'est le prix d'un fil à jour.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [brands, sectors] = await Promise.all([
    prisma.brand.count({ where: OU_MARQUE_PUBLIQUE }),
    prisma.sector.count(),
  ]);

  return {
    title: {
      absolute: 'Made in France — Découvrez les marques françaises',
    },
    description: `${brands} marques françaises référencées dans ${sectors} secteurs. Trouvez qui fabrique en France, et où.`,
    alternates: { canonical: siteUrl() },
    openGraph: {
      type: 'website',
      title: 'Made in France — Découvrez les marques françaises',
      description: `${brands} marques françaises référencées dans ${sectors} secteurs.`,
      url: siteUrl(),
      siteName: 'Made in France',
      locale: 'fr_FR',
    },
  };
}

export default async function HomePage() {
  const PAR_PAGE = 20;
  const [fil, featured, sectorRows, nbMarques] = await Promise.all([
    // La première page du fil, générique, rendue côté serveur à chaque visite.
    // La personnalisation se fait ensuite dans le navigateur (home-feed.tsx).
    lireFil(parametresFil.parse({ limit: String(PAR_PAGE) })),
    prisma.brand.findMany({
      where: { ...OU_MARQUE_PUBLIQUE, isFeatured: true },
      take: 3,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, slug: true, descriptionShort: true, city: true, logoUrl: true, websiteUrl: true, sector: { select: { name: true, color: true } } },
    }),
    prisma.sector.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, color: true, _count: { select: { brands: true } } } }),
    prisma.brand.count({ where: OU_MARQUE_PUBLIQUE }),
  ]);

  const marques: MarqueMiseEnAvant[] = featured.map((b) => ({
    id: b.id, name: b.name, slug: b.slug, description: b.descriptionShort, city: b.city,
    sector: b.sector?.name ?? null, sectorColor: b.sector?.color ?? null, logoUrl: b.logoUrl, websiteUrl: b.websiteUrl,
  }));
  const secteurs: SecteurAccueil[] = sectorRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug, color: s.color, brandCount: s._count.brands }));

  return (
    <HomeContent
      fil={{ produits: fil.data, total: fil.total, parPage: PAR_PAGE }}
      marques={marques}
      secteurs={secteurs}
      nbMarques={nbMarques}
    />
  );
}
