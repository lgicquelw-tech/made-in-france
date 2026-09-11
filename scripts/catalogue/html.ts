/**
 * Texte brut d'un fragment HTML de boutique.
 *
 * Cette fonction existait en **trois copies** identiques (`shopify-scraper.ts`,
 * `woocommerce-scraper.ts`, `import-all-shopify.ts`). Une seule désormais.
 */
export function texteDepuisHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
