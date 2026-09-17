/**
 * Les lectures migrées depuis Express (REBUILD.md T3.8), sur une vraie base.
 * Trois d'entre elles ont changé de comportement, à dessein ; c'est ce qui est testé.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as ficheMarque } from '@/app/api/v1/brands/[slug]/route';
import { GET as rechercheRevendication } from '@/app/api/v1/brands/search/route';
import { GET as produitsDuStudio } from '@/app/api/v1/brands/[slug]/products/all/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

describe('GET /api/v1/brands/[slug]', () => {
  test('ne renvoie JAMAIS les identifiants Stripe ni l affiliation', async () => {
    const m = await creerMarque('exposee');
    await prisma.brand.update({ where: { id: m.id }, data: { stripeCustomerId: 'cus_SECRET', stripeSubscriptionId: 'sub_SECRET', affiliateId: 'aff_SECRET' } });
    const r = await ficheMarque(requete('GET'), { params: { slug: 'exposee' } });
    expect(r.status).toBe(200);
    const texte = JSON.stringify(await r.json());
    expect(texte).not.toContain('SECRET');
    expect(texte).not.toContain('stripeCustomerId');
    expect(texte).toContain('"slug":"exposee"');
  });
  test('inconnue : 404', async () => {
    expect((await ficheMarque(requete('GET'), { params: { slug: 'nope' } })).status).toBe(404);
  });
});

describe('GET /api/v1/brands/search (revendication)', () => {
  test('trouve une marque PENDING_REVIEW — la propriete ne depend pas de la publication', async () => {
    const m = await creerMarque('en-attente-de-revue');
    await prisma.brand.update({ where: { id: m.id }, data: { status: 'PENDING_REVIEW' } });
    const r = await rechercheRevendication(requete('GET', undefined, undefined), {});
    // sans q : liste vide
    expect((await r.json()).data).toEqual([]);
    const r2 = await rechercheRevendication(new Request('http://t/api?q=attente'), {});
    expect((await r2.json()).data.map((b: { slug: string }) => b.slug)).toEqual(['en-attente-de-revue']);
  });
});

describe('GET /api/v1/brands/[slug]/products/all (Studio)', () => {
  test('anonyme : 401 — les brouillons ne sont plus publics', async () => {
    await creerMarque('privee');
    sessionDe(null);
    expect((await produitsDuStudio(requete('GET'), { params: { slug: 'privee' } })).status).toBe(401);
  });
  test('un utilisateur sans lien : 403', async () => {
    await creerMarque('privee');
    const u = await creerUtilisateur('USER'); sessionDe(u.id);
    expect((await produitsDuStudio(requete('GET'), { params: { slug: 'privee' } })).status).toBe(403);
  });
  test('le proprietaire voit tout, brouillons compris', async () => {
    const m = await creerMarque('la-mienne');
    const u = await creerUtilisateur('USER');
    await prisma.brandOwner.create({ data: { brandId: m.id, userId: u.id, role: 'OWNER', isActive: true, acceptedAt: new Date() } });
    await prisma.product.create({ data: { name: 'Brouillon', slug: 'brouillon', brandId: m.id, status: 'DRAFT' } });
    await prisma.product.create({ data: { name: 'Publie', slug: 'publie', brandId: m.id, status: 'ACTIVE' } });
    sessionDe(u.id);
    const r = await produitsDuStudio(requete('GET'), { params: { slug: 'la-mienne' } });
    expect(r.status).toBe(200);
    expect((await r.json()).data.map((p: { status: string }) => p.status).sort()).toEqual(['ACTIVE', 'DRAFT']);
  });
});
