/**
 * Règle de publication d'un produit (REBUILD.md T5.8).
 *
 * Module **pur**. Une question : au vu des contrôles bloquants de l'audit, quel
 * statut ce produit devrait-il avoir ?
 *
 *   - `DRAFT` et tous les contrôles bloquants passent → `ACTIVE`, il est publié ;
 *   - `ACTIVE` et un contrôle bloquant échoue → `DRAFT`, il est retiré ;
 *   - `OUT_OF_STOCK` et `DISCONTINUED` ne sont **jamais** touchés : ce sont des
 *     décisions délibérées, pas des mesures de complétude.
 *
 * C'est le même jeu de contrôles que `pnpm data:audit`, importé d'un seul endroit.
 * L'audit mesure, cette règle décide, la commande applique : trois rôles, un seul
 * critère. Si le critère changeait à un endroit sans changer aux autres, l'audit
 * annoncerait des fiches « publiables » qui ne le seraient pas.
 */

import { CONTROLES_PRODUIT, type FicheProduit } from '../audit/checks';

export type StatutProduit = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';

export interface Verdict {
  /** Le statut à écrire, ou `null` si rien ne change. */
  nouveau: StatutProduit | null;
  /** Les contrôles bloquants en échec — vide si la fiche est complète. */
  manques: string[];
}

const BLOQUANTS = CONTROLES_PRODUIT.filter((c) => c.severite === 'BLOQUANT');

export function manquesBloquants(fiche: FicheProduit): string[] {
  return BLOQUANTS.filter((c) => !c.ok(fiche)).map((c) => c.libelle);
}

export function deciderStatut(fiche: FicheProduit, actuel: StatutProduit): Verdict {
  const manques = manquesBloquants(fiche);

  if (actuel === 'OUT_OF_STOCK' || actuel === 'DISCONTINUED') {
    return { nouveau: null, manques };
  }
  if (actuel === 'DRAFT' && manques.length === 0) {
    return { nouveau: 'ACTIVE', manques };
  }
  if (actuel === 'ACTIVE' && manques.length > 0) {
    return { nouveau: 'DRAFT', manques };
  }
  return { nouveau: null, manques };
}
