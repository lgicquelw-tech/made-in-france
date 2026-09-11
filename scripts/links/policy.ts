/**
 * La règle de désactivation d'un lien mort (REBUILD.md T5.2).
 *
 * Module **pur** : aucune base, aucun réseau, aucune horloge implicite. Tout entre par
 * les paramètres. C'est ce qui permet de le tester (`policy.test.ts`) sans monter quoi
 * que ce soit, et de relire la règle sans dérouler le reste du programme.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * La règle, et pourquoi elle est prudente
 *
 * Désactiver un lien retire du contenu. Se tromper coûte donc plus cher que ne rien
 * faire : une marque vivante disparaît de l'annuaire sans que personne ne s'en rende
 * compte. La décision exige deux conditions **cumulées** :
 *
 *   1. ÉCHECS_REQUIS échecs consécutifs — un incident isolé ne suffit pas ;
 *   2. le premier échec de la série remonte à au moins ANCIENNETÉ_REQUISE — trois
 *      passages lancés dans la même heure ne valent pas mieux qu'un seul.
 *
 * La seconde condition est la plus importante des deux. Sans elle, il suffirait de
 * relancer la commande trois fois de suite pendant une panne d'hébergeur pour vider
 * l'annuaire.
 *
 * Et seul le verdict `mort` compte comme échec. Un `indetermine` (403, 429, délai
 * dépassé) ne prouve rien : il ne fait ni avancer ni reculer le compteur.
 */

import type { Verdict } from '../audit/links';

/** Nombre d'échecs consécutifs exigés avant désactivation. */
export const ECHECS_REQUIS = 3;

/** Ancienneté minimale du premier échec de la série, en millisecondes. */
export const ANCIENNETE_REQUISE_MS = 72 * 60 * 60 * 1000; // 72 heures

/** L'état conservé en base pour une URL, réduit à ce dont la règle a besoin. */
export interface EtatSuivi {
  consecutiveFailures: number;
  firstFailedAt: Date | null;
  disabledAt: Date | null;
}

export interface Decision {
  /** Le nouvel état à écrire en base. */
  etat: EtatSuivi;
  /** Ce qui change pour la fiche qui porte ce lien. */
  action: 'desactiver' | 'reactiver' | 'rien';
  /** Phrase explicative, destinée au rapport affiché. */
  motif: string;
}

const heures = (ms: number): number => Math.floor(ms / (60 * 60 * 1000));

/**
 * Applique la règle à une observation.
 *
 * @param etat     état connu avant ce passage (compteurs à zéro si l'URL est nouvelle)
 * @param verdict  ce que le réseau vient de répondre
 * @param mesureLe instant de l'observation — passé explicitement, jamais lu de l'horloge
 */
export function decider(
  etat: EtatSuivi,
  verdict: Verdict,
  mesureLe: Date,
): Decision {
  // --- Le lien répond : c'est la seule preuve de vie qui existe.
  if (verdict === 'vivant') {
    const etaitDesactive = etat.disabledAt !== null;
    return {
      etat: { consecutiveFailures: 0, firstFailedAt: null, disabledAt: null },
      action: etaitDesactive ? 'reactiver' : 'rien',
      motif: etaitDesactive
        ? 'répond de nouveau — réactivé'
        : 'vivant',
    };
  }

  // --- Un pare-feu a reconnu un robot. On n'en conclut rien, dans aucun sens.
  if (verdict === 'indetermine') {
    return {
      etat,
      action: 'rien',
      motif: 'indéterminé — le compteur ne bouge pas',
    };
  }

  // --- Échec avéré.
  const echecs = etat.consecutiveFailures + 1;
  const premierEchec = etat.firstFailedAt ?? mesureLe;
  const anciennete = mesureLe.getTime() - premierEchec.getTime();
  const suivant: EtatSuivi = {
    consecutiveFailures: echecs,
    firstFailedAt: premierEchec,
    disabledAt: etat.disabledAt,
  };

  if (etat.disabledAt !== null) {
    return { etat: suivant, action: 'rien', motif: 'déjà désactivé' };
  }

  if (echecs < ECHECS_REQUIS) {
    return {
      etat: suivant,
      action: 'rien',
      motif: `échec ${echecs}/${ECHECS_REQUIS} — on attend`,
    };
  }

  if (anciennete < ANCIENNETE_REQUISE_MS) {
    return {
      etat: suivant,
      action: 'rien',
      motif:
        `${echecs} échecs mais le premier date de ${heures(anciennete)} h ` +
        `(il en faut ${heures(ANCIENNETE_REQUISE_MS)}) — on attend`,
    };
  }

  return {
    etat: { ...suivant, disabledAt: mesureLe },
    action: 'desactiver',
    motif: `${echecs} échecs consécutifs depuis ${heures(anciennete)} h — désactivé`,
  };
}
