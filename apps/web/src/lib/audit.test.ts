/** Tests de la piste d'audit (REBUILD.md T3.14) : le calcul des différences, pur. */

import { describe, expect, test } from 'vitest';
import { differences } from './audit';

describe('differences', () => {
  test('ne garde que ce qui a change', () => {
    const d = differences({ name: 'A', city: 'Rennes', yearFounded: 1990 }, { name: 'A', city: 'Brest', yearFounded: 1990 });
    expect(d).toEqual({ city: { avant: 'Rennes', apres: 'Brest' } });
  });
  test('JAMAIS un secret, meme s il a change', () => {
    const d = differences(
      { password: 'a', stripeCustomerId: 'cus_1', stripeSubscriptionId: 's1', affiliateId: 'x', name: 'A' },
      { password: 'b', stripeCustomerId: 'cus_2', stripeSubscriptionId: 's2', affiliateId: 'y', name: 'B' },
    );
    expect(Object.keys(d)).toEqual(['name']);
  });
  test('les textes longs sont tronques, la longueur conservee', () => {
    const long = 'x'.repeat(5000);
    const d = differences({ descriptionLong: 'court' }, { descriptionLong: long });
    expect(String(d.descriptionLong.apres)).toMatch(/^x{300}… \(5000 caractères\)$/);
  });
  test('creation : tout l apres ; suppression : tout l avant', () => {
    expect(differences(null, { name: 'A', city: null })).toEqual({ name: { avant: null, apres: 'A' }, city: { avant: null, apres: null } });
    expect(differences({ name: 'A' }, null)).toEqual({ name: { avant: 'A', apres: null } });
  });
  test('les dates sont comparees par valeur, les horodatages techniques ignores', () => {
    const t = new Date('2026-01-01');
    expect(differences({ publishedAt: t, updatedAt: new Date(1) }, { publishedAt: new Date('2026-01-01'), updatedAt: new Date(2) })).toEqual({});
  });
  test('un objet JSON modifie est detecte', () => {
    const d = differences({ socialLinks: { instagram: 'a' } }, { socialLinks: { instagram: 'b' } });
    expect(d.socialLinks).toEqual({ avant: { instagram: 'a' }, apres: { instagram: 'b' } });
  });
});
