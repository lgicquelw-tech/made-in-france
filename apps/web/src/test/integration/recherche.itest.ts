/**
 * La recherche et les listes publiques, sur une vraie base (REBUILD.md T3.4, T6.3).
 *
 * Les tests unitaires vérifient la forme des requêtes ; ceux-ci vérifient qu'elles
 * **trouvent** — accents compris — et que les filtres s'additionnent réellement.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as rechercheGlobale } from '@/app/api/v1/search/all/route';
import { GET as listeMarques } from '@/app/api/v1/brands/route';
import { GET as listeProduits } from '@/app/api/v1/products/route';

const get = (chemin: string) => new Request(`http://test.local${chemin}`);
const corps = async (r: Response) => r.json();

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "sectors", "regions" CASCADE`;
  const bretagne = await prisma.region.create({ data: { name: 'Bretagne', slug: 'bretagne' } });
  const occitanie = await prisma.region.create({ data: { name: 'Occitanie', slug: 'occitanie' } });
  const mode = await prisma.sector.create({ data: { name: 'Mode & Accessoires', slug: 'mode-accessoires' } });
  const cosmetique = await prisma.sector.create({ data: { name: 'Cosmétique', slug: 'cosmetique' } });

  const marin = await prisma.brand.create({ data: { name: 'PULL MARIN BRETON', slug: 'pull-marin-breton', status: 'ACTIVE', regionId: bretagne.id, sectorId: mode.id, city: 'Quimper' } });
  await prisma.brand.create({ data: { name: 'PULL DU SUD', slug: 'pull-du-sud', status: 'ACTIVE', regionId: occitanie.id, sectorId: mode.id, city: 'Toulouse' } });
  await prisma.brand.create({ data: { name: 'SAVONNERIE DE QUIMPER', slug: 'savonnerie-quimper', status: 'ACTIVE', regionId: bretagne.id, sectorId: cosmetique.id, city: 'Quimper' } });
  await prisma.brand.create({ data: { name: 'CRÈME BRÛLÉE', slug: 'creme-brulee', status: 'ACTIVE', regionId: occitanie.id, sectorId: cosmetique.id, city: 'Albi' } });

  await prisma.product.create({ data: { name: 'Marinière rayée', slug: 'mariniere-rayee', brandId: marin.id, status: 'ACTIVE', priceMin: 89, priceMax: 89 } });
  await prisma.product.create({ data: { name: 'Bonnet marin', slug: 'bonnet-marin', brandId: marin.id, status: 'ACTIVE', priceMin: 29, priceMax: 29 } });
  await prisma.product.create({ data: { name: 'Prototype non publié', slug: 'prototype', brandId: marin.id, status: 'DRAFT', priceMin: 1, priceMax: 1 } });
});

describe('GET /api/v1/brands', () => {
  test('recherche + region + secteur s additionnent', async () => {
    const d = await corps(await listeMarques(get('/api/v1/brands?q=pull&region=bretagne&sector=mode-accessoires'), {}));
    expect(d.data.map((b: { slug: string }) => b.slug)).toEqual(['pull-marin-breton']);
    expect(d.pagination.total).toBe(1);
  });
  test('la ville compte dans la recherche', async () => {
    const d = await corps(await listeMarques(get('/api/v1/brands?q=quimper'), {}));
    expect(d.pagination.total).toBe(2);
  });
  test('sans accent trouve avec accent', async () => {
    const d = await corps(await listeMarques(get('/api/v1/brands?q=creme'), {}));
    expect(d.data[0].slug).toBe('creme-brulee');
  });
  test('un slug de region hostile : 400, rien n est execute', async () => {
    const r = await listeMarques(get("/api/v1/brands?region='%3B%20drop"), {});
    expect(r.status).toBe(400);
  });
  test('pagination reelle', async () => {
    const p1 = await corps(await listeMarques(get('/api/v1/brands?limit=3&page=1'), {}));
    const p2 = await corps(await listeMarques(get('/api/v1/brands?limit=3&page=2'), {}));
    expect(p1.data).toHaveLength(3);
    expect(p2.data).toHaveLength(1);
    expect(p1.pagination).toEqual({ page: 1, limit: 3, total: 4, totalPages: 2 });
  });
});

describe('GET /api/v1/products', () => {
  test('seuls les produits ACTIVE sortent, un brouillon jamais', async () => {
    const d = await corps(await listeProduits(get('/api/v1/products'), {}));
    expect(d.data.map((p: { slug: string }) => p.slug).sort()).toEqual(['bonnet-marin', 'mariniere-rayee']);
  });
  test('recherche par nom de MARQUE aussi, et tri par prix', async () => {
    const d = await corps(await listeProduits(get('/api/v1/products?q=breton&sort=price-asc'), {}));
    expect(d.data.map((p: { priceMin: number }) => p.priceMin)).toEqual([29, 89]);
  });
  test('un tri hors liste blanche : 400', async () => {
    expect((await listeProduits(get('/api/v1/products?sort=DROP'), {})).status).toBe(400);
  });
  test('filtre de prix', async () => {
    const d = await corps(await listeProduits(get('/api/v1/products?priceMin=50'), {}));
    expect(d.data.map((p: { slug: string }) => p.slug)).toEqual(['mariniere-rayee']);
  });
});

describe('GET /api/v1/search/all', () => {
  test('marques et produits ensemble, limite respectee', async () => {
    const d = await corps(await rechercheGlobale(get('/api/v1/search/all?q=marin&limit=1'), {}));
    expect(d.brands).toHaveLength(1);
    expect(d.products).toHaveLength(1);
    expect(d.query).toBe('marin');
  });
  test('saisie vide : listes vides, 200', async () => {
    const r = await rechercheGlobale(get('/api/v1/search/all?q='), {});
    expect(r.status).toBe(200);
    expect(await corps(r)).toEqual({ brands: [], products: [], query: '' });
  });
  test('saisie hostile : 200, aucune casse', async () => {
    const r = await rechercheGlobale(get(`/api/v1/search/all?q=${encodeURIComponent("'; DROP TABLE brands; --")}`), {});
    expect(r.status).toBe(200);
    expect(await prisma.brand.count()).toBe(4);
  });
});
