/**
 * Tests de la construction des requêtes de recherche (REBUILD.md T6.2).
 *
 * Le test qui compte est celui du constat n°4 de l'audit — une injection SQL par la
 * recherche. On ne le teste pas en essayant d'injecter dans une vraie base ; on
 * vérifie la **forme** de la requête : la saisie doit se trouver dans `values`
 * (paramètres liés) et jamais dans `sql` (le texte envoyé au serveur).
 */

import { describe, expect, test, vi } from 'vitest';

vi.mock('./db', () => ({ prisma: { $queryRaw: vi.fn() } }));

import { construireRequetes, rechercher, sansAccents, LIMITE } from './search';
import { prisma } from './db';

const HOSTILE = `l'apostrophe'; DROP TABLE brands; --`;

describe('construireRequetes', () => {
  test('la saisie est un parametre lie, jamais du texte SQL', () => {
    const { marques, produits } = construireRequetes(HOSTILE);
    for (const r of [marques, produits]) {
      expect(r.sql).not.toContain('DROP');
      expect(r.sql).not.toContain("l'apostrophe");
      expect(r.values.some((v) => String(v).includes('DROP TABLE'))).toBe(true);
    }
  });

  test('le texte SQL ne contient que des emplacements numerotes', () => {
    const { marques } = construireRequetes('marinière');
    // Prisma.sql remplace chaque ${...} par ?, puis le pilote numerote ; le texte ne
    // doit contenir aucune valeur en clair.
    expect(marques.sql).not.toContain('marinière');
    expect(marques.sql).not.toContain('mariniere');
    // La saisie est désaccentuée avant d'être liée ; la colonne l'est par unaccent().
    expect(marques.values).toContain('%mariniere%');
    expect(marques.sql).toContain('unaccent(b.name)');
  });

  test('la saisie accentuee est comparee sans accent, des deux cotes', () => {
    const { produits } = construireRequetes('Crème');
    expect(produits.values).toContain('%Creme%');
    expect(produits.values).not.toContain('%Crème%');
    expect(produits.sql).toContain('unaccent(p.name)');
  });

  test('la limite est un parametre, pas une valeur en dur', () => {
    const { marques } = construireRequetes('x');
    expect(marques.values).toContain(LIMITE);
    expect(marques.sql).not.toMatch(/LIMIT\s+\d+/);
    expect(construireRequetes('x', 5).marques.values).toContain(5);
  });

  test('les produits sont filtres sur ACTIVE, dans le texte fixe de la requete', () => {
    // Ce filtre-la DOIT etre du texte, pas un parametre : il ne vient pas du client.
    const { marques, produits } = construireRequetes('x');
    expect(produits.sql).toContain("p.status = 'ACTIVE'");
    expect(produits.sql).toContain("b.status = 'ACTIVE'");
    expect(marques.sql).toContain("b.status = 'ACTIVE'");
  });
});

describe('rechercher', () => {
  test('une saisie vide ne touche pas la base', async () => {
    const q = vi.mocked(prisma.$queryRaw);
    q.mockClear();
    expect(await rechercher('   ')).toEqual({ brands: [], products: [] });
    expect(q).not.toHaveBeenCalled();
  });

  test('une saisie non vide lance exactement deux requetes', async () => {
    const q = vi.mocked(prisma.$queryRaw);
    q.mockClear();
    q.mockResolvedValue([] as never);
    await rechercher('pull');
    expect(q).toHaveBeenCalledTimes(2);
  });
});

test('sansAccents', () => {
  expect(sansAccents('Marinière crème brûlée')).toBe('Mariniere creme brulee');
  expect(sansAccents('ASCII')).toBe('ASCII');
});
