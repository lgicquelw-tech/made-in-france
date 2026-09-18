/**
 * Les compteurs du pied de page (18 septembre 2026) : lus en base, et sur les marques
 * publiques seulement. Ils remplaçaient « 900+ », « 5000+ », « 18 » écrits en dur.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { compter } from '@/lib/chiffres';
import { creerMarque } from './aides';

describe('compter', () => {
  test('ne compte que les marques publiques, leurs produits actifs, et les régions occupées', async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "regions" CASCADE`;
    const bretagne = await prisma.region.create({ data: { name: 'Bretagne', slug: 'bretagne' } });
    const corse = await prisma.region.create({ data: { name: 'Corse', slug: 'corse' } });
    await prisma.region.create({ data: { name: 'Mayotte', slug: 'mayotte' } });

    const publique = await creerMarque('publique');
    await prisma.brand.update({ where: { id: publique.id }, data: { regionId: bretagne.id } });
    const suspendue = await creerMarque('suspendue');
    await prisma.brand.update({ where: { id: suspendue.id }, data: { status: 'SUSPENDED', regionId: corse.id } });

    await prisma.product.create({ data: { name: 'A', slug: 'a', brandId: publique.id, status: 'ACTIVE' } });
    await prisma.product.create({ data: { name: 'B', slug: 'b', brandId: publique.id, status: 'DRAFT' } });
    await prisma.product.create({ data: { name: 'C', slug: 'c', brandId: suspendue.id, status: 'ACTIVE' } });

    expect(await compter()).toEqual({ marques: 1, produits: 1, regions: 1 });
  });
});
