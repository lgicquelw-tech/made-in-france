/** Tests des outils du chat (REBUILD.md T3.7) : forme des requêtes, sans base. */

import { describe, expect, test, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ prisma: { $queryRaw: vi.fn() } }));
import { OUTILS, SECTEURS, construireRechercheMarques, construireRechercheProduits, motsCles } from './outils';

const HOSTILE = "pull'; DROP TABLE products; --";

describe('secteurs', () => {
  test('les 9 secteurs canoniques, et l enumeration des outils les suit', () => {
    expect(SECTEURS).toHaveLength(9);
    for (const outil of OUTILS) {
      const props = (outil.input_schema as { properties: Record<string, { enum?: string[] }> }).properties;
      expect(props.sector.enum).toEqual([...SECTEURS]);
    }
  });
});

describe('construireRechercheProduits', () => {
  test('le secteur et la saisie sont des parametres lies', () => {
    const q = construireRechercheProduits({ query: HOSTILE, sector: 'Mode &amp; Accessoires', max_price: 50 });
    expect(q.sql).not.toContain('DROP');
    expect(q.sql).not.toContain('Accessoires');
    expect(q.values).toContain('Mode & Accessoires'); // &amp; decode
    expect(q.values).toContain(50);
    expect(q.values.some((v) => String(v).includes('pull'))).toBe(true);
  });
  test('seuls les produits ACTIVE avec prix et image, en texte fixe', () => {
    const q = construireRechercheProduits({ query: 'x' });
    expect(q.sql).toContain("p.status = 'ACTIVE'");
    expect(q.sql).toContain('p.price_min > 0');
    expect(q.sql).toContain('p.image_url IS NOT NULL');
  });
  test('la limite est bornee a 12 meme si le modele demande plus', () => {
    expect(construireRechercheProduits({ query: 'x', limit: 500 }).values).toContain(12);
    expect(construireRechercheProduits({ query: 'x' }).values).toContain(8);
  });
});

describe('construireRechercheMarques', () => {
  test('marques publiques seulement : le chat voit ce que le site montre', () => {
    // Le filtre avait ete retire quand 1 marque sur 903 etait ACTIVE ; depuis la validation
    // en bloc du 18 septembre 2026, le statut dit ce qu'il doit dire, et le chat le suit.
    expect(construireRechercheMarques({ query: 'pull' }).sql).toContain("b.status = 'ACTIVE'");
    expect(construireRechercheMarques({ query: '' }).sql).toContain("WHERE b.status = 'ACTIVE'");
  });
  test('la region est un parametre lie, desaccentue', () => {
    const q = construireRechercheMarques({ query: 'pull', region: 'Île-de-France' });
    expect(q.values).toContain('%Ile-de-France%');
    expect(q.sql).not.toContain('Île');
  });
});

test('une marque qui VEND le produit cherche compte', () => {
  expect(construireRechercheMarques({ query: 'pull' }).sql).toContain('EXISTS (SELECT 1 FROM products');
});

test('motsCles : sans accent, minuscules, plus de deux lettres, au plus six', () => {
  expect(motsCles('Un PULL en Laine Mérinos de Bretagne')).toEqual(['pull', 'laine', 'merinos', 'bretagne']);
  expect(motsCles('a b c d e f g h i')).toEqual([]);
  expect(motsCles(undefined)).toEqual([]);
});
