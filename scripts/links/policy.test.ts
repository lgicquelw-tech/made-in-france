/**
 * Tests de la règle de désactivation (REBUILD.md T5.2).
 *
 * Lancés par `pnpm test:links`, avec le lanceur **intégré à Node 22** : la phase 6
 * choisira Vitest ou autre, et ce choix ne doit pas être préempté par une tâche de
 * phase 5. Aucune dépendance ajoutée.
 *
 * Ce qui est vérifié ici est la partie de T5.2 où une erreur se paie cher : chaque
 * désactivation à tort retire une marque vivante de l'annuaire, silencieusement.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  decider,
  ECHECS_REQUIS,
  ANCIENNETE_REQUISE_MS,
  type EtatSuivi,
} from './policy';

const T0 = new Date('2026-09-01T12:00:00.000Z');
const plusTard = (ms: number) => new Date(T0.getTime() + ms);
const HEURE = 60 * 60 * 1000;

const neuf = (): EtatSuivi => ({
  consecutiveFailures: 0,
  firstFailedAt: null,
  disabledAt: null,
});

test('un lien vivant ne declenche rien', () => {
  const d = decider(neuf(), 'vivant', T0);
  assert.equal(d.action, 'rien');
  assert.equal(d.etat.consecutiveFailures, 0);
});

test('un premier echec ne desactive pas', () => {
  const d = decider(neuf(), 'mort', T0);
  assert.equal(d.action, 'rien');
  assert.equal(d.etat.consecutiveFailures, 1);
  assert.deepEqual(d.etat.firstFailedAt, T0);
  assert.equal(d.etat.disabledAt, null);
});

test('trois echecs dans la meme heure ne desactivent pas', () => {
  // Le piege que la regle existe pour eviter : relancer la commande trois fois de
  // suite pendant une panne d'hebergeur ne doit pas vider l'annuaire.
  let etat = neuf();
  for (let i = 0; i < ECHECS_REQUIS + 2; i++) {
    const d = decider(etat, 'mort', plusTard(i * 60_000));
    etat = d.etat;
    assert.equal(d.action, 'rien', `passage ${i + 1} : ne doit pas desactiver`);
  }
  assert.equal(etat.disabledAt, null);
});

test('trois echecs etales sur plus de 72 h desactivent', () => {
  let etat = neuf();
  let derniere = decider(etat, 'mort', T0);
  etat = derniere.etat;
  derniere = decider(etat, 'mort', plusTard(36 * HEURE));
  etat = derniere.etat;
  assert.equal(derniere.action, 'rien');

  derniere = decider(etat, 'mort', plusTard(73 * HEURE));
  assert.equal(derniere.action, 'desactiver');
  assert.deepEqual(derniere.etat.disabledAt, plusTard(73 * HEURE));
  assert.equal(derniere.etat.consecutiveFailures, 3);
});

test('un seul succes au milieu remet le compteur a zero', () => {
  let etat = neuf();
  etat = decider(etat, 'mort', T0).etat;
  etat = decider(etat, 'mort', plusTard(40 * HEURE)).etat;
  assert.equal(etat.consecutiveFailures, 2);

  etat = decider(etat, 'vivant', plusTard(50 * HEURE)).etat;
  assert.equal(etat.consecutiveFailures, 0);
  assert.equal(etat.firstFailedAt, null);

  // La serie repart de zero : l'echec suivant est un premier echec.
  const d = decider(etat, 'mort', plusTard(200 * HEURE));
  assert.equal(d.action, 'rien');
  assert.equal(d.etat.consecutiveFailures, 1);
});

test('un indetermine ne fait ni avancer ni reculer le compteur', () => {
  // Un 403 est un pare-feu qui a reconnu un robot, pas une page absente.
  const etat = decider(neuf(), 'mort', T0).etat;
  const avant = { ...etat };

  const d = decider(etat, 'indetermine', plusTard(100 * HEURE));
  assert.equal(d.action, 'rien');
  assert.equal(d.etat.consecutiveFailures, avant.consecutiveFailures);
  assert.deepEqual(d.etat.firstFailedAt, avant.firstFailedAt);
});

test('un lien fait uniquement d indetermines n est jamais desactive', () => {
  let etat = neuf();
  for (let i = 0; i < 50; i++) {
    etat = decider(etat, 'indetermine', plusTard(i * 24 * HEURE)).etat;
  }
  assert.equal(etat.disabledAt, null);
  assert.equal(etat.consecutiveFailures, 0);
});

test('un lien desactive qui repond de nouveau est reactive', () => {
  let etat = neuf();
  etat = decider(etat, 'mort', T0).etat;
  etat = decider(etat, 'mort', plusTard(40 * HEURE)).etat;
  const d = decider(etat, 'mort', plusTard(80 * HEURE));
  assert.equal(d.action, 'desactiver');

  const retour = decider(d.etat, 'vivant', plusTard(200 * HEURE));
  assert.equal(retour.action, 'reactiver');
  assert.equal(retour.etat.disabledAt, null);
});

test('un lien deja desactive ne redeclenche pas l action', () => {
  const etat: EtatSuivi = {
    consecutiveFailures: 9,
    firstFailedAt: T0,
    disabledAt: plusTard(80 * HEURE),
  };
  const d = decider(etat, 'mort', plusTard(300 * HEURE));
  assert.equal(d.action, 'rien');
  assert.equal(d.etat.consecutiveFailures, 10);
});

test('le seuil d anciennete est bien celui annonce', () => {
  // Juste en dessous : rien. Juste au-dessus : desactivation. On verifie la frontiere,
  // pas une valeur confortablement eloignee.
  const base: EtatSuivi = {
    consecutiveFailures: ECHECS_REQUIS - 1,
    firstFailedAt: T0,
    disabledAt: null,
  };
  const juste_avant = decider(base, 'mort', plusTard(ANCIENNETE_REQUISE_MS - 1000));
  assert.equal(juste_avant.action, 'rien');

  const juste_apres = decider(base, 'mort', plusTard(ANCIENNETE_REQUISE_MS));
  assert.equal(juste_apres.action, 'desactiver');
});
