/**
 * Tests de la construction des listes publiques (REBUILD.md T3.4, T6.2).
 *
 * Deux défauts de l'ancienne API Express sont testés en négatif : la recherche qui
 * perdait les filtres, et le secteur concaténé dans le SQL (constat n°4, second foyer).
 */

import { describe, expect, test } from 'vitest';
import {
  construireListeMarques, construireListeProduits, parametresMarques, parametresProduits, TRIS_PRODUITS,
} from './catalogue-public';

const HOSTILE = `x'; DROP TABLE brands; --`;

describe('parametres', () => {
  test('valeurs par defaut', () => {
    expect(parametresMarques.parse({})).toEqual({ page: 1, limit: 20 });
    expect(parametresProduits.parse({})).toMatchObject({ page: 1, limit: 24, sort: 'newest' });
  });
  test('la limite est bornee, la page positive', () => {
    expect(parametresMarques.safeParse({ limit: '9999' }).success).toBe(false);
    expect(parametresMarques.safeParse({ page: '0' }).success).toBe(false);
  });
  test('un slug de secteur ou de region hostile est REJETE avant toute requete', () => {
    expect(parametresMarques.safeParse({ sector: HOSTILE }).success).toBe(false);
    expect(parametresMarques.safeParse({ region: "'; drop" }).success).toBe(false);
    expect(parametresProduits.safeParse({ sector: 'Cosmétique' }).success).toBe(false); // majuscule, accent
    expect(parametresProduits.parse({ sector: 'cosmetique' }).sector).toBe('cosmetique');
  });
  test('le tri vient d une liste blanche', () => {
    for (const t of TRIS_PRODUITS) expect(parametresProduits.parse({ sort: t }).sort).toBe(t);
    expect(parametresProduits.safeParse({ sort: 'p.name; DROP' }).success).toBe(false);
  });
  test('une chaine vide devient undefined — pas de filtre vide', () => {
    expect(parametresMarques.parse({ q: '  ', region: '' })).toEqual({ page: 1, limit: 20 });
  });
});

describe('construireListeMarques', () => {
  test('recherche ET filtres s additionnent dans la meme requete', () => {
    const { liste } = construireListeMarques(parametresMarques.parse({ q: 'pull', region: 'bretagne', sector: 'mode-accessoires' }));
    expect(liste.sql).toContain('r.slug =');
    expect(liste.sql).toContain('s.slug =');
    expect(liste.sql).toContain('similarity(unaccent(b.name)');
    expect(liste.values).toContain('bretagne');
    expect(liste.values).toContain('mode-accessoires');
    expect(liste.values).toContain('%pull%');
  });
  test('la saisie est un parametre lie, jamais du texte', () => {
    const { liste, compte } = construireListeMarques(parametresMarques.parse({ q: HOSTILE }));
    for (const r of [liste, compte]) {
      expect(r.sql).not.toContain('DROP');
      expect(r.values.some((v) => String(v).includes('DROP'))).toBe(true);
    }
  });
  test('sans filtre : pas de WHERE, tri par nom', () => {
    const { liste } = construireListeMarques(parametresMarques.parse({}));
    expect(liste.sql).not.toContain('WHERE');
    expect(liste.sql).toContain('ORDER BY b.name ASC');
  });
  test('pagination : OFFSET calcule depuis la page', () => {
    const { liste } = construireListeMarques(parametresMarques.parse({ page: '3', limit: '12' }));
    expect(liste.values).toContain(24);
    expect(liste.values).toContain(12);
  });
});

describe('construireListeProduits', () => {
  test('seuls les produits ACTIVE, en texte fixe', () => {
    const { liste, compte } = construireListeProduits(parametresProduits.parse({}));
    expect(liste.sql).toContain("p.status = 'ACTIVE'");
    expect(compte.sql).toContain("p.status = 'ACTIVE'");
  });
  test('le secteur est un parametre lie — plus jamais concatene', () => {
    const { liste } = construireListeProduits(parametresProduits.parse({ sector: 'cosmetique' }));
    expect(liste.sql).toMatch(/s\.slug = \?/);
    expect(liste.sql).not.toContain("'cosmetique'");
    expect(liste.values).toContain('cosmetique');
  });
  test('prix et recherche combines', () => {
    const { liste } = construireListeProduits(parametresProduits.parse({ q: 'pull', priceMin: '20', priceMax: '100' }));
    expect(liste.sql).toContain('p.price_min >=');
    expect(liste.sql).toContain('p.price_max <=');
    expect(liste.values).toEqual(expect.arrayContaining([20, 100, '%pull%']));
  });
  test('les tris de la liste blanche produisent un ORDER BY sans valeur du client', () => {
    expect(construireListeProduits(parametresProduits.parse({ sort: 'price-asc' })).liste.sql).toContain('p.price_min ASC NULLS LAST');
    expect(construireListeProduits(parametresProduits.parse({ sort: 'price-desc' })).liste.sql).toContain('p.price_min DESC NULLS LAST');
    expect(construireListeProduits(parametresProduits.parse({ sort: 'name-asc' })).liste.sql).toContain('p.name ASC');
    expect(construireListeProduits(parametresProduits.parse({})).liste.sql).toContain('p.created_at DESC');
  });
});
