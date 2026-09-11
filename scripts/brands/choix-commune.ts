/**
 * Choix d'une commune parmi les résultats de l'API Adresse (REBUILD.md T5.4).
 *
 * Module **pur**. Le problème qu'il résout : les homonymes. « Saint-Denis » existe à
 * La Réunion, en Seine-Saint-Denis, dans l'Aude, le Gard, le Loiret — et l'API les
 * renvoie tous avec un score voisin. Prendre le premier placerait une marque
 * dionysienne dans l'océan Indien.
 *
 * La règle : la **région de la marque** départage. On garde le résultat dont le
 * contexte administratif la mentionne. Sans correspondance, on ne devine pas — une
 * marque non placée vaut mieux qu'une marque mal placée, parce que la première se
 * voit dans le rapport et la seconde ne se voit qu'en regardant la carte.
 */

export interface ResultatBan {
  label: string;
  /** « 93, Seine-Saint-Denis, Île-de-France » — département puis région. */
  context: string;
  postcode: string;
  score: number;
  type: string;
  latitude: number;
  longitude: number;
}

export type MotifRejet = 'aucun résultat' | 'aucun résultat dans la région' | 'score trop faible';

export interface Choix {
  resultat: ResultatBan | null;
  motif: MotifRejet | null;
}

/** En dessous, l'API a pioché quelque chose de vaguement ressemblant. */
export const SCORE_MINIMAL = 0.6;

const normaliser = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function choisirCommune(
  resultats: ResultatBan[],
  regionMarque: string | null,
): Choix {
  const communes = resultats.filter((r) => r.type === 'municipality');
  if (communes.length === 0) return { resultat: null, motif: 'aucun résultat' };

  let candidats = communes;
  if (regionMarque) {
    const region = normaliser(regionMarque);
    candidats = communes.filter((r) => normaliser(r.context).includes(region));
    if (candidats.length === 0) return { resultat: null, motif: 'aucun résultat dans la région' };
  }

  const meilleur = candidats.reduce((a, b) => (b.score > a.score ? b : a));
  if (meilleur.score < SCORE_MINIMAL) return { resultat: null, motif: 'score trop faible' };
  return { resultat: meilleur, motif: null };
}

/**
 * Formes à interroger pour une valeur de la colonne `city`, dans l'ordre.
 *
 * La colonne contient parfois deux lieux (« Paris / Vincennes », « Orléans /
 * Vendôme ») ou une précision entre parenthèses (« Roubaix / Lille (Métropole) »).
 * On tente la valeur entière, puis la première partie avant `/` ou `(`. Le premier
 * lieu cité est le siège dans tous les cas observés — c'est une convention du fichier
 * source, pas une règle universelle, et elle est signalée ici.
 */
export function formesAInterroger(ville: string): string[] {
  const entiere = ville.trim();
  const premiere = entiere.split(/\s*[/(]\s*/)[0].trim();
  return premiere && premiere !== entiere ? [entiere, premiere] : [entiere];
}
