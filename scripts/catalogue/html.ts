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
    .replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "'")
    .replace(/&lsquo;|&#8216;/g, '‘').replace(/&ldquo;|&#8220;/g, '“').replace(/&rdquo;|&#8221;/g, '”')
    .replace(/&prime;/g, '′').replace(/&Prime;/g, '″').replace(/&hellip;/g, '…').replace(/&euro;/g, '€')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&agrave;/g, 'à').replace(/&ccedil;/g, 'ç')
    // Toute autre entité numérique décimale ou hexadécimale.
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}
