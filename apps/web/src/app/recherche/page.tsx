import { Suspense } from 'react';
import type { Metadata } from 'next';
import { rechercher } from '@/lib/search';
import { siteUrl } from '@/lib/site';
import SearchContent from './search-content';

/**
 * Recherche unifiée — Server Component (REBUILD.md T4.5).
 *
 * ⚠️ `useSearchParams()` impose une frontière `Suspense` dès lors que la page
 * est prérendue : sans elle, `next build` échoue. Ce défaut existait depuis le
 * commit de février 2026, et le mode développement ne le signale pas.
 */

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
  const initialResults = await rechercher(query);

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
