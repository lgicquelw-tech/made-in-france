/**
 * Langue d'un produit collecté, lue dans l'adresse de sa fiche.
 *
 * Les boutiques WooCommerce traduites (WPML, Polylang) exposent **chaque traduction
 * comme un produit distinct** dans l'API Store : même fiche, un identifiant par langue,
 * une adresse préfixée (`/en/product/...`, `/de/produkt/...`). Sans filtre, la collecte
 * du 17 septembre 2026 a enregistré ~1 800 fiches en anglais, allemand, espagnol et
 * néerlandais, et les traductions ont pris les slugs des originaux français.
 *
 * Règle : on garde une fiche si son adresse n'a pas de préfixe de langue (langue par
 * défaut du site, le français pour une marque française) ou si ce préfixe est `fr`.
 */

/** Préfixe de langue d'une adresse (`en`, `de`…), ou `null` s'il n'y en a pas. */
export function langueDuPermalien(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const premier = new URL(url).pathname.split('/').filter(Boolean)[0];
    return premier && /^[a-z]{2}(-[a-z]{2})?$/i.test(premier) ? premier.toLowerCase().slice(0, 2) : null;
  } catch {
    return null;
  }
}

/** Vrai si la fiche est l'originale française : pas de préfixe, ou `fr`. */
export function estFicheFrancaise(url: string | null | undefined): boolean {
  const langue = langueDuPermalien(url);
  return langue === null || langue === 'fr';
}

/**
 * Dernier segment de l'adresse, pour servir de slug quand la boutique n'en fournit pas.
 * Certaines installations WooCommerce omettent `slug` dans l'API Store : sans repli,
 * toutes les fiches d'une marque recevaient `<marque>-undefined` et une seule survivait.
 */
export function slugDepuisPermalien(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    const dernier = segments[segments.length - 1];
    return dernier ? decodeURIComponent(dernier).toLowerCase() : null;
  } catch {
    return null;
  }
}
