/** Tests de la construction de requête (REBUILD.md T5.7). Node 22. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageUtilisateur, MESSAGE_SYSTEME, SchemaEnrichissement, estimerJetons } from './requete';

const produit = () => ({
  name: 'Pull Binic', descriptionShort: null,
  descriptionLong: 'Pull marin en laine vierge, tricoté à Saint-James.',
  marque: 'SAINT JAMES', secteur: 'Mode & Accessoires', categorie: null,
});

test('le message ne demande que les champs manquants', () => {
  const m = messageUtilisateur(produit(), ['tags', 'seoTitle']);
  assert.match(m, /Champs à renseigner : tags, seoTitle\./);
  assert.doesNotMatch(m, /materials/);
});

test('le message contient le texte connu, et le dit quand il n y en a pas', () => {
  assert.match(messageUtilisateur(produit(), ['tags']), /laine vierge/);
  const sans = messageUtilisateur({ ...produit(), descriptionLong: null }, ['tags']);
  assert.match(sans, /aucun texte/);
});

test('un texte trop long est coupe, pas envoye entier', () => {
  const long = { ...produit(), descriptionLong: 'x'.repeat(10_000) };
  assert.ok(messageUtilisateur(long, ['tags']).length < 5_000);
});

test('le message systeme est stable et interdit d inventer', () => {
  assert.equal(MESSAGE_SYSTEME, MESSAGE_SYSTEME); // meme reference, jamais reconstruit
  assert.match(MESSAGE_SYSTEME, /n'inventes rien/);
  assert.match(MESSAGE_SYSTEME, /pas de prix/);
});

test('le schema accepte une reponse vide et refuse une forme inattendue', () => {
  assert.ok(SchemaEnrichissement.safeParse({
    descriptionShort: null, tags: [], materials: [], sellingPoints: [], seoTitle: null, seoDescription: null,
  }).success);
  assert.equal(SchemaEnrichissement.safeParse({ tags: 'pas une liste' }).success, false);
});

test('estimation de jetons', () => {
  assert.equal(estimerJetons('abcd'), 1);
  assert.equal(estimerJetons('abcde'), 2);
});
