/** Tests du choix de commune (REBUILD.md T5.4). Lanceur intégré à Node 22. */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { choisirCommune, communeDeRattachement, formesAInterroger, type ResultatBan } from './choix-commune';

const r = (label: string, context: string, score: number, type = 'municipality'): ResultatBan => ({
  label, context, score, type, postcode: '00000', latitude: 0, longitude: 0,
});

// Les cinq Saint-Denis, tels que l'API les renvoie.
const SAINT_DENIS = [
  r('Saint-Denis', '974, La Réunion', 0.96),
  r('Saint-Denis', '93, Seine-Saint-Denis, Île-de-France', 0.96),
  r('Saint-Denis', '11, Aude, Occitanie', 0.93),
  r('Saint-Denis', '30, Gard, Occitanie', 0.93),
  r('Saint-Denis', '45, Loiret, Centre-Val de Loire', 0.85),
];

test('la region de la marque departage les homonymes', () => {
  assert.equal(choisirCommune(SAINT_DENIS, 'Île-de-France').resultat?.context, '93, Seine-Saint-Denis, Île-de-France');
  assert.equal(choisirCommune(SAINT_DENIS, 'La Réunion').resultat?.context, '974, La Réunion');
  assert.equal(choisirCommune(SAINT_DENIS, 'Centre-Val de Loire').resultat?.context, '45, Loiret, Centre-Val de Loire');
});

test('la comparaison ignore accents et casse', () => {
  assert.equal(choisirCommune(SAINT_DENIS, 'ile-de-france').resultat?.postcode, '00000');
  assert.equal(choisirCommune(SAINT_DENIS, 'ILE-DE-FRANCE').resultat?.context.startsWith('93'), true);
});

test('deux candidats dans la meme region : le meilleur score gagne', () => {
  const c = choisirCommune(SAINT_DENIS, 'Occitanie');
  assert.equal(c.resultat?.context, '11, Aude, Occitanie');
});

test('sans correspondance de region, on ne devine pas', () => {
  const c = choisirCommune(SAINT_DENIS, 'Bretagne');
  assert.equal(c.resultat, null);
  assert.equal(c.motif, 'aucun résultat dans la région');
});

test('sans region connue, le meilleur score gagne', () => {
  const c = choisirCommune(SAINT_DENIS, null);
  assert.equal(c.resultat?.score, 0.96);
});

test('un score trop faible est rejete', () => {
  const c = choisirCommune([r('Quelquepart', '64, Pyrénées-Atlantiques, Nouvelle-Aquitaine', 0.31)], 'Nouvelle-Aquitaine');
  assert.equal(c.resultat, null);
  assert.equal(c.motif, 'score trop faible');
});

test('seules les communes comptent, pas les rues', () => {
  const c = choisirCommune([r('Rue de Bidache', '64, Pyrénées-Atlantiques, Nouvelle-Aquitaine', 0.9, 'street')], 'Nouvelle-Aquitaine');
  assert.equal(c.resultat, null);
  assert.equal(c.motif, 'aucun résultat');
});

test('liste vide', () => {
  assert.equal(choisirCommune([], 'Bretagne').motif, 'aucun résultat');
});

test('formes a interroger : la premiere partie avant / ou ( en repli', () => {
  assert.deepEqual(formesAInterroger('Paris / Vincennes'), ['Paris / Vincennes', 'Paris']);
  assert.deepEqual(formesAInterroger('Roubaix / Lille (Métropole)'), ['Roubaix / Lille (Métropole)', 'Roubaix']);
  assert.deepEqual(formesAInterroger('Saint-Denis (93)'), ['Saint-Denis (93)', 'Saint-Denis']);
  assert.deepEqual(formesAInterroger('Bidache'), ['Bidache']);
  assert.deepEqual(formesAInterroger('(Boutique en ligne)'), ['(Boutique en ligne)']);
});

test('« Île de Groix » : on essaie aussi « Groix »', () => {
  assert.deepEqual(formesAInterroger('Île de Groix'), ['Île de Groix', 'Groix']);
  assert.deepEqual(formesAInterroger("L'Île d'Yeu"), ["L'Île d'Yeu", 'Yeu']);
  // Une commune dont le nom commence par « Ile » sans être une île reste intacte au premier essai.
  assert.equal(formesAInterroger('Ile-Rousse')[0], 'Ile-Rousse');
});

test('commune de rattachement : un lieu-dit designe sa commune, dans la bonne region', () => {
  const lieuDit = (label: string, context: string, city: string, score: number): ResultatBan =>
    ({ label, context, city, score, type: 'street', postcode: '00000', latitude: 1, longitude: 2 });

  const puyricard = [lieuDit('Puyricard 13540 Aix-en-Provence', "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur", 'Aix-en-Provence', 0.7)];
  assert.equal(communeDeRattachement(puyricard, "Provence-Alpes-Côte d'Azur")?.city, 'Aix-en-Provence');
  // Mauvaise région : on ne place pas.
  assert.equal(communeDeRattachement(puyricard, 'Bretagne'), null);
  // Une commune n'est pas un lieu-dit : ce chemin ne la concerne pas.
  assert.equal(communeDeRattachement([r('Groix', '56, Morbihan, Bretagne', 0.94)], 'Bretagne'), null);
  // Score trop faible : rien.
  assert.equal(communeDeRattachement([lieuDit('X', '13, Bouches-du-Rhône, PACA', 'Y', 0.4)], null), null);
});
