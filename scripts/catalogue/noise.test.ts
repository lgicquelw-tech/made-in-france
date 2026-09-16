/**
 * Tests du filtre de bruit (REBUILD.md T5.3). Lanceur intégré à Node 22.
 *
 * Deux familles : ce qui **doit** être rejeté, et — plus important — ce qui **ne doit
 * pas** l'être. Un filtre trop large rend des produits invisibles sans que personne ne
 * s'en aperçoive ; c'est l'erreur qu'on teste le plus.
 */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { detecterBruit, dedoublonner, cleDeNom } from './noise';

// ------------------------------------------------------------ à rejeter

test('carte cadeau, dans toutes ses graphies', () => {
  for (const name of [
    'Carte cadeau',
    'Carte Cadeau 50€',
    'E-carte cadeau',
    'Gift Card',
    'Giftcard 100',
    "Bon d'achat",
    'Chèque cadeau',
  ]) {
    assert.equal(detecterBruit({ name }), 'carte cadeau', name);
  }
});

test('échantillon', () => {
  for (const name of ['Échantillon crème mains', 'Echantillon 5 ml', 'Sample pack', 'Testeur parfum 2ml']) {
    assert.equal(detecterBruit({ name }), 'échantillon', name);
  }
});

test('frais et services', () => {
  for (const name of ['Frais de port', 'Frais de livraison express', 'Emballage cadeau', 'Gift wrapping', 'Supplément personnalisation']) {
    assert.equal(detecterBruit({ name }), 'frais ou service', name);
  }
});

test('produit de test', () => {
  for (const name of ['Test', 'test produit', 'TEST - ne pas commander', 'Lorem ipsum', 'Dummy product']) {
    assert.equal(detecterBruit({ name }), 'produit de test', name);
  }
});

test('nom vide', () => {
  assert.equal(detecterBruit({ name: '' }), 'nom vide');
  assert.equal(detecterBruit({ name: '   ' }), 'nom vide');
});

test('le type de la boutique suffit a rejeter', () => {
  assert.equal(detecterBruit({ name: 'Noël 2026', type: 'Gift Card' }), 'carte cadeau');
  assert.equal(detecterBruit({ name: 'Découverte', type: 'Samples' }), 'échantillon');
});

test('un tag exactement egal suffit, une inclusion non', () => {
  assert.equal(detecterBruit({ name: 'Noël', tags: ['gift card'] }), 'carte cadeau');
  // « idée cadeau » n'est pas « carte cadeau » : c'est un vrai produit qu'on peut offrir.
  assert.equal(detecterBruit({ name: 'Bougie', tags: ['idée cadeau', 'cadeau'] }), null);
});

// ------------------------------------------------------------ à GARDER

test('de vrais produits ne sont pas rejetes', () => {
  // Chacun de ces noms contient un mot qui pourrait faire tiquer un filtre trop large.
  for (const name of [
    'Pull Binic',
    'Marinière Guildo',
    'Coffret cadeau savons',        // un coffret, pas une carte
    'Idée cadeau : bougie',          // « cadeau » sans « carte »
    'Miniature eau de parfum 15 ml', // les parfumeurs vendent des miniatures
    'Testeur de pH piscine',         // « testeur » sans « parfum »
    'Kit de test de dureté',         // « test » pas en tête
    'Contest edition limitée',       // « test » dans un mot
    'Sac de livraison isotherme',    // « livraison » sans « frais de »
    'Papier cadeau recyclé',         // un produit, pas un service
    'Sampler de thés',               // « sampler » n'est pas « sample »
  ]) {
    assert.equal(detecterBruit({ name }), null, `« ${name} » doit etre garde`);
  }
});

test('un prix nul ne suffit pas a rejeter', () => {
  // Un prix absent est une incompletude, que l'audit signale. Pas du bruit.
  assert.equal(detecterBruit({ name: 'Pull Binic', price: 0 }), null);
  assert.equal(detecterBruit({ name: 'Pull Binic', price: null }), null);
});

// ------------------------------------------------------------ doublons

test('cle de nom : accents, casse, ponctuation, espaces', () => {
  assert.equal(cleDeNom('T-Shirt  Marinière'), 't shirt mariniere');
  assert.equal(cleDeNom('t shirt mariniere'), 't shirt mariniere');
  assert.equal(cleDeNom('  PULL   BINIC ! '), 'pull binic');
});

test('dedoublonner garde le premier et rattache les suivants', () => {
  const r = dedoublonner([
    { name: 'Pull Binic', id: 1 },
    { name: 'Marinière Guildo', id: 2 },
    { name: 'pull binic', id: 3 },
    { name: 'PULL-BINIC', id: 4 },
  ]);
  assert.deepEqual(r.gardes.map((p) => p.id), [1, 2]);
  assert.deepEqual(r.doublons.map((d) => [d.produit.id, d.doublonDe]), [[3, 0], [4, 0]]);
});

test('dedoublonner ne fusionne pas deux variantes de nom differentes', () => {
  // Bleu et rouge sont deux produits. Le rapprochement n'est pas flou.
  const r = dedoublonner([{ name: 'Pull Binic bleu' }, { name: 'Pull Binic rouge' }]);
  assert.equal(r.gardes.length, 2);
  assert.equal(r.doublons.length, 0);
});

test('dedoublonner sur une liste vide', () => {
  const r = dedoublonner([]);
  assert.deepEqual(r, { gardes: [], doublons: [] });
});
