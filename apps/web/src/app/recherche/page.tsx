import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import SearchContent, {
  type SearchBrand,
  type SearchProduct,
  type SearchResults,
} from './search-content';

/**
 * Recherche unifiée — Server Component (REBUILD.md T4.5).
 *
 * ⚠️ `useSearchParams()` impose une frontière `Suspense` dès lors que la page
 * est prérendue : sans elle, `next build` échoue. Ce défaut existait depuis le
 * commit de février 2026, et le mode développement ne le signale pas.
 */

const LIMIT = 20;

function normalize(value: string): string {
  // Forme échappée plutôt que les caractères combinants littéraux, qui sont
  // invisibles dans un éditeur.
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function search(query: string): Promise<SearchResults> {
  if (!query.trim()) return { brands: [], products: [] };

  const like = `%${query}%`;
  const likePlain = `%${normalize(query)}%`;

  // `Prisma.sql` : chaque valeur est un paramètre lié. Une apostrophe dans la
  // recherche ne peut rien casser — c'est le constat n°4, déjà fermé côté API.
  const where = Prisma.sql`(
    b.name ILIKE ${like} OR b.name ILIKE ${likePlain}
    OR b.description_short ILIKE ${like}
    OR similarity(b.name, ${query}) > 0.3
  )`;

  const [brands, products] = await Promise.all([
    prisma.$queryRaw<SearchBrand[]>`
      SELECT 'brand' AS type, b.id, b.name, b.slug,
             b.description_short AS "description", b.logo_url AS "logoUrl", b.city,
             s.name AS sector, s.slug AS "sectorSlug", s.color AS "sectorColor"
      FROM brands b
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE ${where}
      ORDER BY similarity(b.name, ${query}) DESC, b.name ASC
      LIMIT ${LIMIT}
    `,
    prisma.$queryRaw<SearchProduct[]>`
      SELECT 'product' AS type, p.id, p.name, p.slug,
             p.description_short AS "description", p.image_url AS "imageUrl",
             p.price_min AS "priceMin", p.price_max AS "priceMax",
             b.name AS "brandName", b.slug AS "brandSlug", s.color AS "sectorColor"
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE p.status = 'ACTIVE'
        AND (
          p.name ILIKE ${like} OR p.name ILIKE ${likePlain}
          OR similarity(p.name, ${query}) > 0.3
        )
      ORDER BY similarity(p.name, ${query}) DESC, p.name ASC
      LIMIT ${LIMIT}
    `,
  ]);

  return { brands, products };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const query = (searchParams.q ?? '').trim();

  return {
    title: query ? `Recherche : ${query}` : 'Rechercher une marque ou un produit',
    description:
      'Cherchez parmi les marques et les produits fabriqués en France, par nom, ville ou secteur.',
    alternates: { canonical: `${siteUrl()}/recherche` },
    // ⚠️ Une page de résultats ne s'indexe pas : chaque requête créerait une
    // page de contenu mince, en nombre illimité. La page de recherche vide,
    // elle, reste indexable.
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? '').trim();
  const initialResults = await search(query);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Chargement…
        </div>
      }
    >
      <SearchContent initialQuery={query} initialResults={initialResults} />
    </Suspense>
  );
}
