/** Tests du nettoyage HTML (REBUILD.md T5.5) : les entités que les boutiques laissent dans leurs titres. */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { texteDepuisHtml } from './html';

test('balises et entites nommees', () => {
  assert.equal(texteDepuisHtml('Cuillère à café <br/>Corinthe'), 'Cuillère à café Corinthe');
  assert.equal(texteDepuisHtml('Lacets jaunes &#8211; embouts gris'), 'Lacets jaunes – embouts gris');
  assert.equal(texteDepuisHtml('Coffret &amp; Bague &quot;L&#39;Or&quot;'), 'Coffret & Bague "L\'Or"');
  assert.equal(texteDepuisHtml('Th&eacute; &agrave; la menthe'), 'Thé à la menthe');
  assert.equal(texteDepuisHtml('Caf&#x00E9;'), 'Café');
});

test('vide et null', () => {
  assert.equal(texteDepuisHtml(null), '');
  assert.equal(texteDepuisHtml('   '), '');
});
