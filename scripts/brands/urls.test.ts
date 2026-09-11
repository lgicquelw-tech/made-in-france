/** Tests du nettoyage d'URL (REBUILD.md T5.4). Lanceur intégré à Node 22. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retirerParametresDeSuivi } from './urls';

test('retire utm_* et fbclid, garde le reste', () => {
  const sale = 'https://boutique.example/?utm_source=ig&utm_medium=social&fbclid=ABC&page=2';
  assert.equal(retirerParametresDeSuivi(sale), 'https://boutique.example/?page=2');
});

test('une URL propre est rendue telle quelle', () => {
  assert.equal(retirerParametresDeSuivi('https://www.example.com/'), 'https://www.example.com/');
  assert.equal(retirerParametresDeSuivi('https://www.example.com/produits?tri=prix'), 'https://www.example.com/produits?tri=prix');
});

test('la query string disparait entierement si elle ne contenait que du suivi', () => {
  assert.equal(retirerParametresDeSuivi('https://a.example/p?gclid=1&utm_campaign=x'), 'https://a.example/p');
});

test('la casse des noms de parametre est ignoree', () => {
  assert.equal(retirerParametresDeSuivi('https://a.example/?UTM_Source=x&FBCLID=y'), 'https://a.example/');
});

test('une URL non analysable est rendue intacte', () => {
  assert.equal(retirerParametresDeSuivi('pas une url'), 'pas une url');
});

test('le cas reel de la base', () => {
  const reel = 'https://rbl-recycled-by-lisa.sumupstore.com/?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnOgKFBE45lPW7emTOE7_b2ymEUKaQTdudBKIy4ZG-4QXpOQB5M7md8J4lvis_aem_tXSYxrLIDLJ9ulC_LU6K6g';
  assert.equal(retirerParametresDeSuivi(reel), 'https://rbl-recycled-by-lisa.sumupstore.com/');
});
