/** Tests du fil de produits (REBUILD.md T8.9) : forme de la requête, sans base. */

import { describe, expect, test, vi } from 'vitest';
vi.mock('./db', () => ({ prisma: { $queryRaw: vi.fn() } }));
import { construireFil, parametresFil } from './feed';

describe('parametresFil', () => {
  test('listes en virgules, slugs seuls, dix au plus', () => {
    const p = parametresFil.parse({ s: 'mode-accessoires,gastronomie', m: 'saint-james', q: 'pull,laine' });
    expect(p.s).toEqual(['mode-accessoires', 'gastronomie']);
    expect(p.q).toEqual(['pull', 'laine']);
    expect(parametresFil.parse({ s: "x'; DROP,ok" }).s).toEqual(['ok']); // le hostile ne passe pas le motif de slug
    expect(parametresFil.parse({ m: Array.from({ length: 30 }, (_, i) => `m${i}`).join(',') }).m).toHaveLength(10);
  });
  test('valeurs par defaut', () => {
    expect(parametresFil.parse({})).toEqual({ s: [], m: [], q: [], page: 1, limit: 24 });
  });
});

describe('construireFil', () => {
  test('sans signal : ni marque, ni secteur, ni mot dans le score', () => {
    const { liste } = construireFil(parametresFil.parse({}), '2026-09-17');
    expect(liste.sql).not.toContain('b.slug IN');
    expect(liste.sql).not.toContain('s.slug IN');
    expect(liste.sql).not.toContain('ILIKE');
    expect(liste.sql).toContain("p.status = 'ACTIVE'");
    expect(liste.sql).toContain('p.image_url IS NOT NULL');
    expect(liste.sql).toContain('buy_url_dead_at IS NULL');
  });
  test('avec signaux : chaque valeur est un parametre lie', () => {
    const { liste } = construireFil(parametresFil.parse({ s: 'gastronomie', m: 'saint-james', q: 'pull' }), '2026-09-17');
    expect(liste.sql).toContain('b.slug IN');
    expect(liste.sql).toContain('s.slug IN');
    expect(liste.values).toEqual(expect.arrayContaining(['gastronomie', 'saint-james', '%pull%']));
    expect(liste.sql).not.toContain('gastronomie');
  });
  test('l ordre est stable dans la journee : hachage par jour, jamais RANDOM()', () => {
    const { liste } = construireFil(parametresFil.parse({}), '2026-09-17');
    expect(liste.sql).not.toMatch(/RANDOM\(\)/i);
    expect(liste.sql).toContain('md5(p.id::text ||');
    expect(liste.values).toContain('2026-09-17');
  });
  test('la diversite penalise le deuxieme produit d une meme marque', () => {
    const { liste } = construireFil(parametresFil.parse({}), '2026-09-17');
    expect(liste.sql).toContain('PARTITION BY p.brand_id');
    expect(liste.sql).toContain('(rang - 1) * 1.5');
  });
  test('pagination : OFFSET depuis la page', () => {
    const { liste } = construireFil(parametresFil.parse({ page: '3', limit: '12' }), '2026-09-17');
    expect(liste.values).toContain(24);
  });
});
