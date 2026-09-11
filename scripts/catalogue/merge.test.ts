/**
 * Tests de la règle de fusion (REBUILD.md T5.5). Lanceur intégré à Node 22.
 *
 * Le test qui compte : un second passage **ne touche pas** aux champs éditoriaux.
 * C'est le défaut exact que la règle existe pour empêcher.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { donneesCreation, donneesMiseAJour, CHAMPS_COLLECTES, type ProduitCollecte } from './merge';

const QUAND = new Date('2026-09-11T10:00:00.000Z');

const collecte = (): ProduitCollecte => ({
  externalSource: 'shopify',
  externalId: '42',
  name: 'Pull Binic',
  slug: 'saint-james-pull-binic',
  descriptionShort: 'Description courte de la boutique.',
  descriptionLong: 'Description longue de la boutique, telle quelle.',
  priceMin: 89,
  priceMax: 89,
  currency: 'EUR',
  imageUrl: 'https://cdn.example.com/binic.jpg',
  galleryUrls: ['https://cdn.example.com/binic.jpg'],
  externalBuyUrl: 'https://www.saint-james.com/products/pull-binic',
  externalData: '{"handle":"pull-binic"}',
});

test('la creation pose tout, la provenance, et le statut DRAFT', () => {
  const d = donneesCreation(collecte(), 'brand-1', QUAND);
  assert.equal(d.brandId, 'brand-1');
  assert.equal(d.status, 'DRAFT');
  assert.equal(d.externalSource, 'shopify');
  assert.equal(d.externalId, '42');
  assert.deepEqual(d.collectedAt, QUAND);
  assert.equal(d.descriptionLong, 'Description longue de la boutique, telle quelle.');
});

test('la mise a jour ne contient AUCUN champ editorial', () => {
  const d = donneesMiseAJour(collecte(), QUAND) as Record<string, unknown>;
  for (const champ of ['descriptionShort', 'descriptionLong', 'slug', 'status', 'categoryId',
    'materials', 'madeInFranceLevel', 'aiSellingPoints', 'seoTitle', 'seoDescription', 'brandId']) {
    assert.equal(champ in d, false, `« ${champ} » ne doit pas etre reecrit par un scraping`);
  }
});

test('la mise a jour contient tous les champs collectes, et la date', () => {
  const d = donneesMiseAJour(collecte(), QUAND) as Record<string, unknown>;
  for (const champ of CHAMPS_COLLECTES) {
    assert.equal(champ in d, true, `« ${champ} » doit etre reecrit`);
  }
  assert.deepEqual(d.collectedAt, QUAND);
  assert.equal(d.priceMin, 89);
});

test('scenario complet : enrichissement puis rescrape', () => {
  // 1. creation depuis la boutique
  const fiche: Record<string, unknown> = donneesCreation(collecte(), 'brand-1', QUAND);
  // 2. un enrichissement (modele ou main) remplace la description
  fiche.descriptionLong = 'Texte enrichi, qui a coute des appels de modele.';
  fiche.status = 'ACTIVE';
  // 3. la boutique change son prix et repasse
  const plusTard = new Date('2026-10-01T10:00:00.000Z');
  const nouvelle = { ...collecte(), priceMin: 79, priceMax: 79 };
  Object.assign(fiche, donneesMiseAJour(nouvelle, plusTard));

  assert.equal(fiche.priceMin, 79, 'le prix suit la boutique');
  assert.deepEqual(fiche.collectedAt, plusTard, 'la date de collecte avance');
  assert.equal(fiche.descriptionLong, 'Texte enrichi, qui a coute des appels de modele.', 'l enrichissement survit');
  assert.equal(fiche.status, 'ACTIVE', 'le statut survit');
});
