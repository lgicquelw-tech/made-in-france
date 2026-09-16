/** Tests de la règle de publication (REBUILD.md T5.8). Lanceur intégré à Node 22. */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { deciderStatut } from './policy';
import type { FicheProduit } from '../audit/checks';

const complete = (): FicheProduit => ({
  descriptionShort: 'Une description courte qui dépasse les quarante caractères.',
  imageUrl: 'https://cdn.example.com/p.jpg',
  priceMin: 29,
  externalBuyUrl: 'https://www.example.com/products/p',
  affiliateUrl: null,
  categoryId: null,
  galleryUrls: [],
  materials: [],
  madeInFranceLevel: null,
  buyUrlDeadAt: null,
});

test('un DRAFT complet est publie', () => {
  const v = deciderStatut(complete(), 'DRAFT');
  assert.equal(v.nouveau, 'ACTIVE');
  assert.deepEqual(v.manques, []);
});

test('un DRAFT incomplet reste DRAFT, et dit pourquoi', () => {
  const v = deciderStatut({ ...complete(), imageUrl: null }, 'DRAFT');
  assert.equal(v.nouveau, null);
  assert.deepEqual(v.manques, ['Une image']);
});

test('un ACTIVE devenu incomplet est retire', () => {
  const v = deciderStatut({ ...complete(), priceMin: 0 }, 'ACTIVE');
  assert.equal(v.nouveau, 'DRAFT');
  assert.deepEqual(v.manques, ['Un prix strictement positif']);
});

test('un ACTIVE complet ne bouge pas', () => {
  assert.equal(deciderStatut(complete(), 'ACTIVE').nouveau, null);
});

test('un lien d achat mort retire le produit', () => {
  // T5.2 pose la date ; T5.8 en tire la consequence. Les deux mecanismes se rejoignent ici.
  const v = deciderStatut({ ...complete(), buyUrlDeadAt: new Date() }, 'ACTIVE');
  assert.equal(v.nouveau, 'DRAFT');
  assert.deepEqual(v.manques, ["Un lien d'achat valide"]);
});

test('les statuts deliberes ne sont jamais touches', () => {
  assert.equal(deciderStatut(complete(), 'OUT_OF_STOCK').nouveau, null);
  assert.equal(deciderStatut(complete(), 'DISCONTINUED').nouveau, null);
  assert.equal(deciderStatut({ ...complete(), imageUrl: null }, 'DISCONTINUED').nouveau, null);
});

test('les champs recommandes ne comptent pas', () => {
  // Pas de categorie, pas de matieres, pas de galerie : publiable quand meme.
  const v = deciderStatut({ ...complete(), categoryId: null, materials: [], galleryUrls: [] }, 'DRAFT');
  assert.equal(v.nouveau, 'ACTIVE');
});
