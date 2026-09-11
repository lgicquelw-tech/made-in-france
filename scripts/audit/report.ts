/**
 * Mise en forme du rapport d'audit (REBUILD.md T5.1).
 *
 * Le rapport doit tenir dans un terminal et se lire sans effort : un chiffre par
 * ligne, une barre pour le coup d'œil, et toujours le **manque** à côté du taux —
 * « 96 % » est agréable, « il en reste 37 » est actionnable.
 */

import type { Controle, Severite } from './checks';

export interface ResultatControle {
  cle: string;
  libelle: string;
  severite: Severite;
  ok: number;
  total: number;
}

export interface Bilan {
  total: number;
  /** Fiches satisfaisant tous les contrôles bloquants. */
  publiables: number;
  controles: ResultatControle[];
}

/** Applique tous les contrôles à toutes les fiches. */
export function evaluer<T>(fiches: T[], controles: Controle<T>[]): Bilan {
  const resultats: ResultatControle[] = controles.map((c) => ({
    cle: c.cle,
    libelle: c.libelle,
    severite: c.severite,
    ok: 0,
    total: fiches.length,
  }));
  const bloquants = controles
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.severite === 'BLOQUANT');
  let publiables = 0;

  for (const fiche of fiches) {
    let complete = true;
    controles.forEach((c, i) => {
      if (c.ok(fiche)) resultats[i].ok += 1;
    });
    for (const { c } of bloquants) {
      if (!c.ok(fiche)) {
        complete = false;
        break;
      }
    }
    if (complete) publiables += 1;
  }

  return { total: fiches.length, publiables, controles: resultats };
}

const BARRE = 24;

function barre(taux: number): string {
  const pleins = Math.round(taux * BARRE);
  return '█'.repeat(pleins) + '·'.repeat(BARRE - pleins);
}

/**
 * Taux affiche.
 *
 * On arrondit **vers le bas**, sauf quand le compte est exact : sinon 899 sur 903
 * s'affiche « 100 % » alors qu'il manque quatre fiches, et le manque disparait
 * de l'ecran au moment meme ou il faudrait le voir.
 */
function pourcent(ok: number, total: number): string {
  if (total === 0) return '  — ';
  const brut = (ok / total) * 100;
  const affiche = ok === total ? 100 : Math.min(99, Math.floor(brut));
  return `${affiche}`.padStart(3) + '%';
}

export function afficherBilan(titre: string, bilan: Bilan): void {
  const { total, publiables, controles } = bilan;
  console.log(`\n${titre} — ${total} fiches`);
  console.log('─'.repeat(78));

  if (total === 0) {
    console.log('  (aucune fiche)');
    return;
  }

  for (const severite of ['BLOQUANT', 'RECOMMANDE'] as const) {
    const lot = controles.filter((c) => c.severite === severite);
    if (lot.length === 0) continue;
    console.log(
      severite === 'BLOQUANT'
        ? '\n  Bloquant — sans ça, la fiche ne doit pas être publiée'
        : '\n  Recommandé — publiable, mais incomplet',
    );
    for (const c of lot) {
      const manque = c.total - c.ok;
      console.log(
        `    ${c.libelle.padEnd(44)} ${barre(c.ok / c.total)} ` +
          `${pourcent(c.ok, c.total)}   ${manque === 0 ? '' : `manque ${manque}`}`,
      );
    }
  }

  console.log('─'.repeat(78));
  console.log(
    `  Publiables (tous les contrôles bloquants) : ${publiables} / ${total} ` +
      `(${pourcent(publiables, total).trim()})`,
  );
  if (publiables < total) {
    console.log(`  Il reste ${total - publiables} fiche(s) à débloquer.`);
  }
}

/** Tableau générique clé → compte, trié du plus fréquent au moins fréquent. */
export function afficherRepartition(
  titre: string,
  compte: Map<string, number>,
  limite = 12,
): void {
  const lignes = [...compte.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${titre}`);
  console.log('─'.repeat(78));
  if (lignes.length === 0) {
    console.log('  (rien)');
    return;
  }
  for (const [cle, n] of lignes.slice(0, limite)) {
    console.log(`  ${String(n).padStart(5)}  ${cle}`);
  }
  if (lignes.length > limite) {
    console.log(`  ${'…'.padStart(5)}  et ${lignes.length - limite} autres`);
  }
}
