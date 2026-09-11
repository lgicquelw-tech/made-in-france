/**
 * Filtrage du bruit dans un catalogue scrappé (REBUILD.md T5.3).
 *
 * Une boutique en ligne contient des lignes qui ne sont pas des produits : cartes
 * cadeaux, échantillons, frais de port, produits de test oubliés par le marchand.
 * Importés tels quels, ils polluent les listes et les compteurs — « 40 000 produits »
 * en comptait une part inconnue.
 *
 * Module **pur** : aucune base, aucun réseau. Une fonction, une réponse : `null` si le
 * produit est légitime, sinon la **raison** du rejet. La raison est conservée pour que
 * l'import puisse dire ce qu'il a écarté, et pourquoi — un filtre muet est un filtre
 * qu'on ne peut pas corriger.
 *
 * Principe de prudence : **en cas de doute, on garde.** Rejeter à tort un vrai produit
 * coûte plus cher qu'accepter une carte cadeau, parce que le premier est invisible et
 * le second se voit.
 */

export interface ProduitBrut {
  name: string;
  /** Type ou catégorie fourni par la boutique (`product_type` Shopify, catégories Woo). */
  type?: string | null;
  tags?: string[] | null;
  price?: number | null;
  /** Poignée ou slug côté boutique, quand il existe. */
  handle?: string | null;
}

export type RaisonRejet =
  | 'carte cadeau'
  | 'échantillon'
  | 'frais ou service'
  | 'produit de test'
  | 'nom vide';

interface Regle {
  raison: RaisonRejet;
  motif: RegExp;
}

/** Retire les accents : « Échantillon » → « Echantillon », « chèque » → « cheque ». */
const sansAccents = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Les motifs sont volontairement **étroits**. Un mot comme « miniature » n'y est pas :
 * les parfumeurs vendent des miniatures. Un mot comme « test » seul n'y est pas non
 * plus : « Testeur de pH » est un produit.
 *
 * Ils sont écrits **sans accent** et appliqués à un texte désaccentué. Ce n'est pas
 * une facilité : `\b` en JavaScript ne connaît que l'ASCII. Devant « É », il ne voit
 * pas de frontière de mot, et « Échantillon » passait là où « Echantillon » était
 * rejeté. Découvert par le test, le 11 septembre 2026.
 */
const REGLES_SUR_LE_NOM: Regle[] = [
  {
    raison: 'carte cadeau',
    motif: /\b(e-?)?(cartes?[ -]cadeaux?|gift[ -]?cards?|bons?[ -]d'achat|cheques?[ -]cadeaux?)\b/i,
  },
  {
    raison: 'échantillon',
    motif: /\b(echantillons?|samples?|testeurs? (?:de )?parfum)\b/i,
  },
  {
    raison: 'frais ou service',
    motif: /\b(frais de (?:port|livraison|expedition)|shipping (?:fee|cost)s?|emballage[ -]cadeau|gift[ -]?wrap(?:ping)?|supplement|participation aux frais|don a l'association)\b/i,
  },
  {
    raison: 'produit de test',
    motif: /^(test|essai|dummy|sample product|produit[ -]test|lorem ipsum|ne pas commander|do not (?:buy|order))\b/i,
  },
];

const REGLES_SUR_LE_TYPE: Regle[] = [
  { raison: 'carte cadeau', motif: /\b(gift ?cards?|cartes? cadeaux?)\b/i },
  { raison: 'échantillon', motif: /\b(samples?|echantillons?)\b/i },
];

/**
 * Dit si un produit est du bruit, et pourquoi.
 *
 * @returns `null` si le produit est à garder, sinon la raison du rejet.
 */
export function detecterBruit(p: ProduitBrut): RaisonRejet | null {
  const nom = sansAccents((p.name ?? '').trim());
  if (nom.length === 0) return 'nom vide';

  for (const regle of REGLES_SUR_LE_NOM) {
    if (regle.motif.test(nom)) return regle.raison;
  }

  const type = sansAccents((p.type ?? '').trim());
  if (type) {
    for (const regle of REGLES_SUR_LE_TYPE) {
      if (regle.motif.test(type)) return regle.raison;
    }
  }

  // Les tags sont le signal le plus faible : un marchand tague « cadeau » un produit
  // qu'on peut offrir. On ne regarde qu'un tag explicitement égal, pas une inclusion.
  const tags = (p.tags ?? []).map((t) => t.trim().toLowerCase());
  if (tags.includes('gift card') || tags.includes('carte cadeau')) return 'carte cadeau';

  return null;
}

/**
 * Clé de rapprochement d'un nom : minuscules, sans accents, sans ponctuation, espaces
 * réduits. « T-Shirt  Marinière » et « t shirt mariniere » donnent la même clé.
 */
export function cleDeNom(nom: string): string {
  return sansAccents(nom)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ResultatDedoublonnage<T> {
  gardes: T[];
  /** Les écartés, chacun avec l'index (dans `gardes`) du produit qu'il doublonne. */
  doublons: { produit: T; doublonDe: number }[];
}

/**
 * Écarte les doublons **au sein d'une même marque** : même nom, à l'accent et à la
 * ponctuation près. Le premier rencontré est gardé — l'ordre d'entrée fait donc foi,
 * et l'appelant est responsable de passer le plus récent en premier s'il le souhaite.
 *
 * Ce n'est volontairement pas un rapprochement flou : deux produits qui ne diffèrent
 * que par la couleur dans le nom (« Pull Binic bleu » / « Pull Binic rouge ») sont deux
 * produits. On ne fusionne que l'identique.
 */
export function dedoublonner<T extends { name: string }>(
  produits: T[],
): ResultatDedoublonnage<T> {
  const vus = new Map<string, number>();
  const gardes: T[] = [];
  const doublons: { produit: T; doublonDe: number }[] = [];

  for (const p of produits) {
    const cle = cleDeNom(p.name);
    const deja = vus.get(cle);
    if (deja !== undefined) {
      doublons.push({ produit: p, doublonDe: deja });
      continue;
    }
    vus.set(cle, gardes.length);
    gardes.push(p);
  }

  return { gardes, doublons };
}
