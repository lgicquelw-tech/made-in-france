/**
 * Identité de l'éditeur du site, telle qu'elle doit figurer dans les mentions légales
 * (loi pour la confiance dans l'économie numérique, art. 6-III) et la politique de
 * confidentialité (RGPD, art. 13).
 *
 * **Rien n'est inventé ici.** Un champ `null` s'affiche « à renseigner » sur la page :
 * c'est au propriétaire du site de le compléter avant la mise en ligne (REBUILD.md T7.5).
 * On ne met pas en ligne avec un champ `null` : `pnpm build` ne le bloque pas, la loi si.
 */
export const EDITEUR = {
  /** Nom du site tel qu'il apparaît partout. */
  nomDuSite: 'Made in France',
  /** Raison sociale ou nom de la personne physique. */
  raisonSociale: null as string | null,
  /** SAS, SARL, entreprise individuelle… */
  formeJuridique: null as string | null,
  /** SIREN ou SIRET, RCS. */
  immatriculation: null as string | null,
  /** Adresse postale du siège. */
  adresse: null as string | null,
  /** Adresse de contact, aussi pour l'exercice des droits RGPD et les demandes de retrait. */
  email: null as string | null,
  /** Directeur ou directrice de la publication. */
  directionPublication: null as string | null,
  /** Hébergeur : nom, adresse, contact. À fixer avec T7.1 (Vercel, Neon…). */
  hebergeur: null as string | null,
  /** Date de dernière révision des textes juridiques. */
  dateRevision: '17 septembre 2026',
} as const;

/** Un champ ou la mention explicite qu'il manque — jamais une valeur inventée. */
export function ouARenseigner(valeur: string | null): string {
  return valeur ?? '[à renseigner par l’éditeur]';
}

/** Vrai si un champ obligatoire manque encore : la page l'affiche en tête. */
export function mentionsIncompletes(): boolean {
  return [EDITEUR.raisonSociale, EDITEUR.adresse, EDITEUR.email, EDITEUR.directionPublication, EDITEUR.hebergeur].some((v) => v === null);
}
