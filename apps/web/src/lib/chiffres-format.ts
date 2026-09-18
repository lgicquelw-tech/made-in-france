/**
 * La partie **cliente** des chiffres du pied de page : le type et le formatage. Séparée
 * de `chiffres.ts`, qui lit la base et ne doit jamais être importé par un composant
 * `'use client'` — Prisma finirait dans le paquet du navigateur.
 */
export interface Chiffres {
  marques: number;
  produits: number;
  /** Régions où au moins une marque publique est installée. */
  regions: number;
}

/** « 35 137 », à la française. */
export const formaterNombre = (n: number): string => n.toLocaleString('fr-FR');
