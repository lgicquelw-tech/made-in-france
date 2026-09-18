/** Tests de la règle de validation des marques (décision du 18 septembre 2026). */

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { deciderStatutMarque } from './marques-policy';
import type { FicheMarque } from '../audit/checks';

const complete: FicheMarque = {
  descriptionShort: 'Atelier de tricot breton, laine vierge filée et tricotée à Quimper.',
  sectorId: 's1', regionId: 'r1', websiteUrl: 'https://www.exemple.fr', logoUrl: null, coverImageUrl: null,
  galleryUrls: [], city: 'Quimper', latitude: null, longitude: null, descriptionLong: null, yearFounded: null, socialLinks: {},
};

test('une fiche complete en attente est validee', () => {
  assert.deepEqual(deciderStatutMarque(complete, 'PENDING_REVIEW'), { nouveau: 'ACTIVE', manques: [] });
});

test('une fiche incomplete reste en attente, et dit pourquoi', () => {
  const v = deciderStatutMarque({ ...complete, regionId: null, descriptionShort: 'Trop court' }, 'PENDING_REVIEW');
  assert.equal(v.nouveau, null);
  assert.deepEqual(v.manques, ['Description courte (≥ 40 caractères)', 'Rattachée à une région']);
});

test('un contact par reseau social suffit, sans site', () => {
  const v = deciderStatutMarque({ ...complete, websiteUrl: null, socialLinks: { instagram: 'https://instagram.com/x' } }, 'PENDING_REVIEW');
  assert.equal(v.nouveau, 'ACTIVE');
});

test('les decisions deja prises ne bougent pas, completes ou non', () => {
  for (const statut of ['ACTIVE', 'SUSPENDED', 'REJECTED', 'DRAFT'] as const) {
    assert.equal(deciderStatutMarque(complete, statut).nouveau, null, statut);
    assert.equal(deciderStatutMarque({ ...complete, sectorId: null }, statut).nouveau, null, statut);
  }
});
