import { siteUrl } from './site';

/**
 * Données structurées (REBUILD.md T4.11).
 *
 * Deux briques que Google exploite directement :
 *  - `BreadcrumbList` alimente le fil d'ariane affiché **sous le titre** dans
 *    les résultats, à la place de l'URL brute ;
 *  - `ItemList` dit à un moteur qu'une page est une liste, et dans quel ordre.
 *
 * Le composant est volontairement minuscule : `dangerouslySetInnerHTML` est le
 * seul moyen d'insérer du JSON-LD sans que React n'échappe les guillemets.
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export type Crumb = { name: string; path: string };

export function breadcrumbList(crumbs: Crumb[]): Record<string, unknown> {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Accueil', path: '/' }, ...crumbs].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${base}${crumb.path}`,
    })),
  };
}

export function itemList(
  name: string,
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${base}${item.path}`,
    })),
  };
}
