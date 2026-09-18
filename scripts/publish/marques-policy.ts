/**
 * Règle de validation des marques — `pnpm data:publish:brands`.
 *
 * Décision du propriétaire du 18 septembre 2026 : les marques importées du fichier
 * source (`PENDING_REVIEW` depuis `pnpm bootstrap`) sont **validées en bloc** dès qu'elles
 * passent tous les contrôles bloquants de l'audit (T5.1). Ce n'est pas une mesure de
 * complétude qui se substitue à l'éditorial : c'est l'éditorial qui a décidé que la
 * complétude suffisait pour ces 903 fiches, choisies une à une dans `data/brands.xlsx`.
 *
 * Ce que la règle ne fait **jamais** :
 * - toucher une marque `ACTIVE`, `SUSPENDED` ou `REJECTED` — ces états sont des décisions ;
 * - toucher un `DRAFT` — c'est une fiche en cours de saisie, pas une fiche à examiner ;
 * - publier une fiche incomplète : elle reste `PENDING_REVIEW`, avec la liste de ce qui manque.
 */
import { CONTROLES_MARQUE, type FicheMarque } from '../audit/checks';

export type StatutMarque = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface VerdictMarque {
  /** Le statut à écrire, ou `null` pour ne rien changer. */
  nouveau: StatutMarque | null;
  manques: string[];
}

export function manquesBloquants(fiche: FicheMarque): string[] {
  return CONTROLES_MARQUE.filter((c) => c.severite === 'BLOQUANT' && !c.ok(fiche)).map((c) => c.libelle);
}

export function deciderStatutMarque(fiche: FicheMarque, actuel: StatutMarque): VerdictMarque {
  const manques = manquesBloquants(fiche);
  if (actuel !== 'PENDING_REVIEW') return { nouveau: null, manques };
  return { nouveau: manques.length === 0 ? 'ACTIVE' : null, manques };
}
