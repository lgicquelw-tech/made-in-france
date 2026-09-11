/**
 * Quels champs d'un produit peuvent être enrichis, et lesquels le sont déjà
 * (REBUILD.md T5.7).
 *
 * Module **pur**. Deux fonctions :
 *
 *   - `champsManquants` dit ce qui est vide — et donc ce qu'on a le droit de demander
 *     à un modèle. Un champ déjà rempli, par un humain ou par un passage précédent,
 *     ne coûte rien à ne pas redemander et coûte cher à réécrire.
 *   - `appliquerEnrichissement` ne remplit **que** ces champs-là. Si le modèle propose
 *     une valeur pour un champ déjà rempli, elle est ignorée.
 *
 * C'est la même discipline que la règle de fusion des scrapers (T5.5), appliquée à
 * l'enrichissement : l'écriture ne touche jamais ce qui existe.
 */

export const CHAMPS_ENRICHISSABLES = [
  'descriptionShort',
  'tags',
  'materials',
  'aiSellingPoints',
  'seoTitle',
  'seoDescription',
] as const;

export type ChampEnrichissable = (typeof CHAMPS_ENRICHISSABLES)[number];

export interface ProduitAEnrichir {
  descriptionShort: string | null;
  tags: unknown;
  materials: unknown;
  aiSellingPoints: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Ce qu'un modèle renvoie. Tous les champs sont facultatifs : il peut ne rien savoir. */
export interface Enrichissement {
  descriptionShort?: string | null;
  tags?: string[];
  materials?: string[];
  sellingPoints?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
}

/** Longueur en dessous de laquelle une description courte compte comme absente. */
export const DESCRIPTION_MINIMALE = 40;

const listeVide = (v: unknown): boolean => !Array.isArray(v) || v.length === 0;
const texteVide = (v: unknown, min = 1): boolean =>
  typeof v !== 'string' || v.trim().length < min;

export function champsManquants(p: ProduitAEnrichir): ChampEnrichissable[] {
  const manques: ChampEnrichissable[] = [];
  if (texteVide(p.descriptionShort, DESCRIPTION_MINIMALE)) manques.push('descriptionShort');
  if (listeVide(p.tags)) manques.push('tags');
  if (listeVide(p.materials)) manques.push('materials');
  if (listeVide(p.aiSellingPoints)) manques.push('aiSellingPoints');
  if (texteVide(p.seoTitle)) manques.push('seoTitle');
  if (texteVide(p.seoDescription)) manques.push('seoDescription');
  return manques;
}

/** Une liste proposée n'est retenue que si elle contient de vraies chaînes non vides. */
const listePropre = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const propre = v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim());
  return propre.length > 0 ? propre : null;
};

const textePropre = (v: unknown, min = 1): string | null =>
  typeof v === 'string' && v.trim().length >= min ? v.trim() : null;

/** Ce qui sera écrit en base : chaque champ avec son type exact. */
export interface DonneesEnrichissement {
  descriptionShort?: string;
  tags?: string[];
  materials?: string[];
  aiSellingPoints?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Données à écrire : uniquement les champs manquants pour lesquels le modèle a proposé
 * quelque chose d'exploitable. Un objet vide signifie « rien à écrire ».
 */
export function appliquerEnrichissement(
  existant: ProduitAEnrichir,
  propose: Enrichissement,
): DonneesEnrichissement {
  const manques = new Set(champsManquants(existant));
  const d: DonneesEnrichissement = {};

  const texte = (champ: 'descriptionShort' | 'seoTitle' | 'seoDescription', v: string | null) => {
    if (manques.has(champ) && v !== null) d[champ] = v;
  };
  const liste = (champ: 'tags' | 'materials' | 'aiSellingPoints', v: string[] | null) => {
    if (manques.has(champ) && v !== null) d[champ] = v;
  };

  texte('descriptionShort', textePropre(propose.descriptionShort, DESCRIPTION_MINIMALE));
  liste('tags', listePropre(propose.tags));
  liste('materials', listePropre(propose.materials));
  liste('aiSellingPoints', listePropre(propose.sellingPoints));
  texte('seoTitle', textePropre(propose.seoTitle));
  texte('seoDescription', textePropre(propose.seoDescription));
  return d;
}
