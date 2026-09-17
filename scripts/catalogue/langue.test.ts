/** Tests de la lecture de langue et de slug dans l'adresse d'une fiche (REBUILD.md T5.5). */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { estFicheFrancaise, langueDuPermalien, slugDepuisPermalien } from './langue';

test('prefixe de langue', () => {
  assert.equal(langueDuPermalien('https://www.le-pull-francais.com/en/product/ange'), 'en');
  assert.equal(langueDuPermalien('https://lecolibrifrenchy.fr/de/produkt/halswaermer/'), 'de');
  assert.equal(langueDuPermalien('https://graindesail.com/fr/produit/assortiment/'), 'fr');
  assert.equal(langueDuPermalien('https://maisonbedel.fr/product/miel-toutes-fleurs/'), null);
  // « product » n'a que sept lettres mais n'est pas un code de langue ; « es » en est un.
  assert.equal(langueDuPermalien('https://x.fr/es/producto/nueces/'), 'es');
  assert.equal(langueDuPermalien('https://x.fr/en-us/product/a'), 'en');
});

test('fiche francaise : sans prefixe ou fr', () => {
  assert.equal(estFicheFrancaise('https://maisonbedel.fr/product/miel-toutes-fleurs/'), true);
  assert.equal(estFicheFrancaise('https://graindesail.com/fr/produit/assortiment/'), true);
  assert.equal(estFicheFrancaise('https://www.le-pull-francais.com/en/product/ange'), false);
  assert.equal(estFicheFrancaise('https://x.fr/nl/product/sokken/'), false);
  // Sans adresse, on ne peut pas savoir : on garde.
  assert.equal(estFicheFrancaise(null), true);
  assert.equal(estFicheFrancaise('pas une url'), true);
});

test('slug de repli depuis le permalien', () => {
  assert.equal(
    slugDepuisPermalien('https://deshommesetdesboeufs.com/produit/saucisse-seche-100-boeuf/'),
    'saucisse-seche-100-boeuf',
  );
  assert.equal(slugDepuisPermalien('https://x.fr/product/Caf%C3%A9-Noir'), 'café-noir');
  assert.equal(slugDepuisPermalien('https://x.fr/'), null);
  assert.equal(slugDepuisPermalien(null), null);
  assert.equal(slugDepuisPermalien('rien'), null);
});
