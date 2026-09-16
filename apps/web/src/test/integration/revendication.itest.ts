/**
 * La revendication de marque, sur une vraie base (REBUILD.md T6.3, règle 0).
 *
 * Règle 0 de CLAUDE.md : la propriété d'une marque ne s'accorde **jamais**
 * automatiquement. Une inscription avec `claimBrandSlug` doit créer une
 * `BrandClaimRequest` en `PENDING` — et **aucun** `BrandOwner`. Deux routes
 * accordaient le rôle OWNER directement jusqu'au 1er septembre 2026 ; ce test est
 * là pour que ça ne revienne pas.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { POST as inscrire } from '@/app/api/auth/register/route';
import { GET as suisJeProprietaire } from '@/app/api/v1/brands/[slug]/ownership/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

const MDP = 'un-mot-de-passe-long-et-sur';

describe('POST /api/auth/register avec claimBrandSlug', () => {
  test('cree le compte et une demande PENDING — jamais un BrandOwner', async () => {
    const m = await creerMarque('a-revendiquer');
    const r = await inscrire(requete('POST', {
      email: 'Fondatrice@Example.fr', password: MDP, name: 'Anne Martin',
      claimBrandSlug: m.slug, siret: '12345678900011',
    }), {});
    expect(r.status).toBe(201);
    const corps = await r.json();
    expect(corps.claim.status).toBe('PENDING');

    const user = await prisma.user.findUnique({ where: { email: 'fondatrice@example.fr' } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe('USER');

    const demandes = await prisma.brandClaimRequest.findMany({ where: { brandId: m.id } });
    expect(demandes).toHaveLength(1);
    expect(demandes[0].status).toBe('PENDING');
    expect(demandes[0].userId).toBe(user!.id);
    expect(demandes[0].proofDetails).toContain('12345678900011');

    // Le point de la regle 0 :
    expect(await prisma.brandOwner.count({ where: { brandId: m.id } })).toBe(0);
  });

  test('le mot de passe n est pas stocke en clair', async () => {
    const r = await inscrire(requete('POST', { email: 'x@example.fr', password: MDP, name: 'X' }), {});
    expect(r.status).toBe(201);
    const u = await prisma.user.findUnique({ where: { email: 'x@example.fr' } });
    expect(u!.password).not.toBe(MDP);
    expect(u!.password).toMatch(/^\$2[aby]\$/); // bcrypt
  });

  test('une marque inconnue : 404, et AUCUN compte orphelin', async () => {
    const r = await inscrire(requete('POST', { email: 'o@example.fr', password: MDP, name: 'O', claimBrandSlug: 'n-existe-pas' }), {});
    expect(r.status).toBe(404);
    expect(await prisma.user.count({ where: { email: 'o@example.fr' } })).toBe(0);
  });

  test('une adresse deja prise : 400', async () => {
    await creerUtilisateur('USER', 'dup');
    const r = await inscrire(requete('POST', { email: 'user-dup@test.local', password: MDP, name: 'D' }), {});
    expect(r.status).toBe(400);
  });

  test('un mot de passe trop court : 400 avec le detail du champ', async () => {
    const r = await inscrire(requete('POST', { email: 'c@example.fr', password: 'court', name: 'C' }), {});
    expect(r.status).toBe(400);
    expect((await r.json()).details).toHaveProperty('password');
  });
});

describe('GET /api/v1/brands/[slug]/ownership', () => {
  test('une demande PENDING ne fait PAS un proprietaire', async () => {
    const m = await creerMarque('en-attente');
    const u = await creerUtilisateur('USER');
    await prisma.brandClaimRequest.create({ data: {
      brandId: m.id, userId: u.id, email: u.email, firstName: 'A', lastName: 'B', proofType: 'declaration', status: 'PENDING',
    } });
    sessionDe(u.id);
    const r = await suisJeProprietaire(requete('GET'), { params: { slug: m.slug } });
    expect(await r.json()).toEqual({ isOwner: false, role: null });
  });

  test('un lien OWNER accepte et actif : proprietaire', async () => {
    const m = await creerMarque('acceptee');
    const u = await creerUtilisateur('USER');
    await prisma.brandOwner.create({ data: { brandId: m.id, userId: u.id, role: 'OWNER', isActive: true, acceptedAt: new Date() } });
    sessionDe(u.id);
    const r = await suisJeProprietaire(requete('GET'), { params: { slug: m.slug } });
    expect(await r.json()).toEqual({ isOwner: true, role: 'OWNER' });
  });

  test('un lien non accepte : pas proprietaire', async () => {
    const m = await creerMarque('invitee');
    const u = await creerUtilisateur('USER');
    await prisma.brandOwner.create({ data: { brandId: m.id, userId: u.id, role: 'OWNER', isActive: true, acceptedAt: null } });
    sessionDe(u.id);
    const r = await suisJeProprietaire(requete('GET'), { params: { slug: m.slug } });
    expect((await r.json()).isOwner).toBe(false);
  });

  test('sans session : pas proprietaire, sans erreur', async () => {
    const m = await creerMarque('publique');
    sessionDe(null);
    const r = await suisJeProprietaire(requete('GET'), { params: { slug: m.slug } });
    expect(r.status).toBe(200);
    expect((await r.json()).isOwner).toBe(false);
  });
});
