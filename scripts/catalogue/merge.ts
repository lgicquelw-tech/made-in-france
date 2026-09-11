/**
 * Règle de fusion d'un produit scrappé avec la fiche existante (REBUILD.md T5.5).
 *
 * Module **pur**. Il répond à une question : quand un scraper repasse sur un produit
 * déjà en base, **quels champs a-t-il le droit d'écrire ?**
 *
 * Avant : `update({ data: productData })` réécrivait tout, y compris `descriptionLong`.
 * Un enrichissement payé en appels de modèle, ou une description reprise à la main,
 * était effacé au passage suivant — silencieusement, et sans recours.
 *
 * La règle tient en deux listes :
 *
 *   - CHAMPS_COLLECTES : ce que la boutique connaît mieux que nous, réécrit à chaque
 *     passage. Prix, images, lien d'achat, données brutes, date de collecte.
 *   - Tout le reste est **éditorial** : posé une fois à la création, jamais réécrit.
 *     Descriptions, slug (une URL publiée ne change pas), statut (piloté par l'audit,
 *     T5.8), catégorie, matières, points de vente, SEO.
 *
 * Le nom est collecté : c'est la boutique qui nomme son produit. Le compromis est
 * assumé — un renommage éditorial serait écrasé — et il est signalé ici plutôt que
 * découvert plus tard.
 *
 * Et la description brute de la boutique est conservée dans `externalData`, pour
 * qu'une amélioration côté marchand reste accessible sans toucher au champ éditorial.
 */

export interface ProduitCollecte {
  externalSource: 'shopify' | 'woocommerce';
  externalId: string;
  name: string;
  /** Slug définitif, préfixé par la marque. Posé une fois. */
  slug: string;
  descriptionShort: string | null;
  descriptionLong: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  imageUrl: string | null;
  galleryUrls: string[];
  externalBuyUrl: string | null;
  /** Charge utile brute de la boutique, sérialisée. */
  externalData: string;
}

/** Les champs que le scraping a le droit de réécrire à chaque passage. */
export const CHAMPS_COLLECTES = [
  'name',
  'priceMin',
  'priceMax',
  'currency',
  'imageUrl',
  'galleryUrls',
  'externalBuyUrl',
  'externalData',
] as const;

export type ChampCollecte = (typeof CHAMPS_COLLECTES)[number];

/** Données écrites à la **création** : tout, plus la provenance et le statut initial. */
export function donneesCreation(p: ProduitCollecte, brandId: string, collecteLe: Date) {
  return {
    brandId,
    name: p.name,
    slug: p.slug,
    descriptionShort: p.descriptionShort,
    descriptionLong: p.descriptionLong,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    currency: p.currency,
    imageUrl: p.imageUrl,
    galleryUrls: p.galleryUrls,
    externalBuyUrl: p.externalBuyUrl,
    externalId: p.externalId,
    externalSource: p.externalSource,
    externalData: p.externalData,
    collectedAt: collecteLe,
    // DRAFT, pas ACTIVE : la publication est pilotée par l'audit (T5.8), pas par le
    // seul fait d'avoir été scrappé. Avant, tout produit collecté était en ligne
    // immédiatement, cartes cadeaux comprises.
    status: 'DRAFT' as const,
  };
}

/** Données écrites à la **mise à jour** : uniquement les champs collectés. */
export function donneesMiseAJour(p: ProduitCollecte, collecteLe: Date) {
  const donnees: Partial<Pick<ProduitCollecte, ChampCollecte>> & { collectedAt: Date } = {
    collectedAt: collecteLe,
  };
  for (const champ of CHAMPS_COLLECTES) {
    (donnees as Record<string, unknown>)[champ] = p[champ];
  }
  return donnees;
}
