/**
 * Tests de la normalisation à l'import (REBUILD.md T6.2).
 *
 * Chaque cas ci-dessous correspond à un défaut qui a réellement existé dans ce projet.
 * Le test n'est pas là pour la couverture : il est là pour que le défaut ne revienne
 * pas sans qu'on le sache.
 */

import { describe, expect, test } from 'vitest';
import { cleanUrl, lireNom, normalizeColumnName, slugify } from './normalisation';

describe('lireNom — les noms numeriques', () => {
  test('909, 1083 et 1336 sont de vraies marques : le nombre devient une chaine', () => {
    // XLSX lit ces cellules comme des nombres. Trois marques etaient perdues en silence.
    expect(lireNom(909)).toBe('909');
    expect(lireNom(1083)).toBe('1083');
  });
  test('une cellule vide donne une chaine vide, pas "null" ni "undefined"', () => {
    expect(lireNom(null)).toBe('');
    expect(lireNom(undefined)).toBe('');
  });
  test('une chaine est rendue telle quelle', () => {
    expect(lireNom('SAINT JAMES')).toBe('SAINT JAMES');
  });
});

describe('cleanUrl — le piege des emojis', () => {
  test('un emoji prefixe par https:// est REJETE, meme si new URL() l accepte', () => {
    // `new URL('https://🌿')` est valide : les URL autorisent l'unicode dans l'hote.
    // Combine au prefixage automatique, cela a produit 899 adresses de logo cassees.
    expect(cleanUrl('🌿')).toBeNull();
    expect(cleanUrl('https://🌬️')).toBeNull();
    expect(cleanUrl('👜')).toBeNull();
  });
  test('un domaine sans protocole recoit https://', () => {
    expect(cleanUrl('example.fr')).toBe('https://example.fr');
    expect(cleanUrl('www.example.fr/boutique')).toBe('https://www.example.fr/boutique');
  });
  test('un protocole existant est conserve', () => {
    expect(cleanUrl('http://example.fr')).toBe('http://example.fr');
  });
  test('les parametres de suivi sont retires', () => {
    expect(cleanUrl('https://a.example/?utm_source=ig&fbclid=x')).toBe('https://a.example/');
  });
  test('vide, null, non-chaine : null', () => {
    expect(cleanUrl('')).toBeNull();
    expect(cleanUrl('   ')).toBeNull();
    expect(cleanUrl(null)).toBeNull();
    expect(cleanUrl(undefined)).toBeNull();
  });
  test('un nom d hote sans point est rejete', () => {
    expect(cleanUrl('localhost')).toBeNull();
    expect(cleanUrl('boutique')).toBeNull();
  });
});

describe('slugify', () => {
  test('accents, casse, espaces, ponctuation', () => {
    expect(slugify('Marinière & Cie')).toBe('mariniere-cie');
    expect(slugify("L'ATELIER DU CUIR")).toBe('latelier-du-cuir');
    expect(slugify('  Saint   James  ')).toBe('saint-james');
  });
  test('un nom numerique donne un slug numerique', () => {
    expect(slugify('1083')).toBe('1083');
  });
  test('pas de tirets en tete, en queue, ni doubles', () => {
    expect(slugify('--a--b--')).toBe('a-b');
  });
});

describe('normalizeColumnName', () => {
  test('les en-tetes Excel sont rapproches sans accent ni casse', () => {
    expect(normalizeColumnName('  Région ')).toBe('region');
    expect(normalizeColumnName('Site Web')).toBe('site web');
  });
});
