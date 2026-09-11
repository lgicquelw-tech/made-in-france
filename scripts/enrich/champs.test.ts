/** Tests de la règle « champs manquants seulement » (REBUILD.md T5.7). Node 22. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { champsManquants, appliquerEnrichissement, type ProduitAEnrichir } from './champs';

const vide = (): ProduitAEnrichir => ({
  descriptionShort: null, tags: [], materials: [], aiSellingPoints: [], seoTitle: null, seoDescription: null,
});
const plein = (): ProduitAEnrichir => ({
  descriptionShort: 'Une description courte écrite par un humain, assez longue pour compter.',
  tags: ['pull', 'laine'], materials: ['laine'], aiSellingPoints: ['chaud'],
  seoTitle: 'Pull Binic', seoDescription: 'Le pull marin.',
});

test('un produit vide manque de tout', () => {
  assert.deepEqual(champsManquants(vide()), ['descriptionShort', 'tags', 'materials', 'aiSellingPoints', 'seoTitle', 'seoDescription']);
});

test('un produit plein ne manque de rien', () => {
  assert.deepEqual(champsManquants(plein()), []);
});

test('une description trop courte compte comme manquante', () => {
  assert.ok(champsManquants({ ...plein(), descriptionShort: 'Bijoux.' }).includes('descriptionShort'));
});

test('l enrichissement ne remplit QUE les champs manquants', () => {
  const existant = { ...plein(), tags: [], seoTitle: null };
  const d = appliquerEnrichissement(existant, {
    descriptionShort: 'Une autre description proposée par le modèle, à ne pas retenir.',
    tags: ['a', 'b'], materials: ['coton — À IGNORER'], sellingPoints: ['x — À IGNORER'],
    seoTitle: 'Titre proposé', seoDescription: 'À IGNORER',
  });
  assert.deepEqual(d, { tags: ['a', 'b'], seoTitle: 'Titre proposé' });
});

test('une proposition vide ou inutilisable n ecrit rien', () => {
  assert.deepEqual(appliquerEnrichissement(vide(), {}), {});
  assert.deepEqual(appliquerEnrichissement(vide(), { tags: [], materials: ['', '  '], descriptionShort: 'Court.' }), {});
});

test('les listes sont nettoyees, pas recopiees', () => {
  const d = appliquerEnrichissement(vide(), { tags: [' laine ', '', 'pull'] });
  assert.deepEqual(d.tags, ['laine', 'pull']);
});

test('sur un produit plein, rien n est ecrit quoi que propose le modele', () => {
  assert.deepEqual(appliquerEnrichissement(plein(), { tags: ['autre'], seoTitle: 'Autre' }), {});
});
