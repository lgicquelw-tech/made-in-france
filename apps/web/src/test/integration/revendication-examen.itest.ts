/**
 * L'examen humain des revendications, sur une vraie base (REBUILD.md T8.1).
 *
 * C'est la règle n°0 de `CLAUDE.md` qui se joue ici : la propriété d'une marque ne
 * s'accorde **que** par cette route, et **que** pour un administrateur. Ce qu'on vérifie
 * d'abord, c'est tout ce qui ne doit accorder aucun droit.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as lister } from '@/app/api/admin/claims/route';
import { POST as decider } from '@/app/api/admin/claims/[id]/route';
import { GET as studios } from '@/app/api/admin/studios/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

async function demandeEnAttente(marqueSlug?: string) {
  const demandeur = await creerUtilisateur('USER', `demandeur-${Math.random().toString(36).slice(2)}`);
  const marque = await creerMarque(marqueSlug);
  const demande = await prisma.brandClaimRequest.create({
    data: {
      brandId: marque.id, userId: demandeur.id, email: demandeur.email,
      firstName: 'Camille', lastName: 'Martin', proofType: 'declaration', status: 'PENDING',
    },
  });
  return { demandeur, marque, demande };
}

describe('lecture de la file', () => {
  test('anonyme : 401 ; utilisateur ordinaire : 403', async () => {
    sessionDe(null);
    expect((await lister(requete('GET'), {})).status).toBe(401);
    const u = await creerUtilisateur('USER');
    sessionDe(u.id);
    expect((await lister(requete('GET'), {})).status).toBe(403);
  });

  test('un administrateur voit les demandes en attente, avec l indice de domaine', async () => {
    const { demande, marque } = await demandeEnAttente();
    await prisma.brand.update({ where: { id: marque.id }, data: { websiteUrl: 'https://www.test.local' } });
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);

    const r = await lister(new Request('http://test.local/api/admin/claims?status=PENDING'), {});
    expect(r.status).toBe(200);
    const trouvee = (await r.json()).data.find((d: { id: string }) => d.id === demande.id);
    expect(trouvee.domaineMarque).toBe('test.local');
    expect(trouvee.marqueDejaGeree).toBe(false);
    expect(trouvee.compteExiste).toBe(true);
  });
});

describe('décision', () => {
  test('un utilisateur ordinaire ne peut pas s accorder une marque : 403, aucun droit créé', async () => {
    const { demande, demandeur, marque } = await demandeEnAttente();
    sessionDe(demandeur.id);
    const r = await decider(requete('POST', { decision: 'APPROVED' }), { params: { id: demande.id } });
    expect(r.status).toBe(403);
    expect(await prisma.brandOwner.count({ where: { brandId: marque.id } })).toBe(0);
    expect((await prisma.brandClaimRequest.findUniqueOrThrow({ where: { id: demande.id } })).status).toBe('PENDING');
  });

  test('accorder : un propriétaire, une seule fois, et une trace signée', async () => {
    const { demande, demandeur, marque } = await demandeEnAttente();
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);

    const r = await decider(requete('POST', { decision: 'APPROVED', notes: 'SIRET vérifié au téléphone' }), { params: { id: demande.id } });
    expect(r.status).toBe(200);

    const droits = await prisma.brandOwner.findMany({ where: { brandId: marque.id } });
    expect(droits).toHaveLength(1);
    expect(droits[0].userId).toBe(demandeur.id);
    expect(droits[0].role).toBe('OWNER');

    const apres = await prisma.brandClaimRequest.findUniqueOrThrow({ where: { id: demande.id } });
    expect(apres.status).toBe('APPROVED');
    expect(apres.reviewedBy).toBe(admin.id);
    expect(apres.reviewNotes).toBe('SIRET vérifié au téléphone');

    const trace = await prisma.auditLog.findFirst({ where: { action: 'claim.approve', targetId: marque.id } });
    expect(trace?.userEmail).toBe(admin.email);

    // Deux fois : refusé, et le droit n'est pas dupliqué.
    const r2 = await decider(requete('POST', { decision: 'APPROVED' }), { params: { id: demande.id } });
    expect(r2.status).toBe(400);
    expect(await prisma.brandOwner.count({ where: { brandId: marque.id } })).toBe(1);
  });

  test('refuser : aucun droit, la raison est gardée', async () => {
    const { demande, marque } = await demandeEnAttente();
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);

    const r = await decider(requete('POST', { decision: 'REJECTED', notes: 'Aucun lien avec la marque' }), { params: { id: demande.id } });
    expect(r.status).toBe(200);
    expect(await prisma.brandOwner.count({ where: { brandId: marque.id } })).toBe(0);
    const apres = await prisma.brandClaimRequest.findUniqueOrThrow({ where: { id: demande.id } });
    expect(apres.status).toBe('REJECTED');
    expect(apres.reviewNotes).toBe('Aucun lien avec la marque');
    expect(await prisma.auditLog.count({ where: { action: 'claim.reject', targetId: marque.id } })).toBe(1);
  });

  test('un compte supprimé entre-temps : refus d accorder, pas de 500', async () => {
    const { demande, demandeur, marque } = await demandeEnAttente();
    await prisma.brandClaimRequest.update({ where: { id: demande.id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: demandeur.id } });
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);

    const r = await decider(requete('POST', { decision: 'APPROVED' }), { params: { id: demande.id } });
    expect(r.status).toBe(400);
    expect(await prisma.brandOwner.count({ where: { brandId: marque.id } })).toBe(0);
  });

  test('une décision hors liste est rejetée par Zod', async () => {
    const { demande } = await demandeEnAttente();
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);
    expect((await decider(requete('POST', { decision: 'OWNER' }), { params: { id: demande.id } })).status).toBe(400);
  });
});

describe('GET /api/admin/studios', () => {
  test('ne liste que les marques réellement gérées, et compte les demandes en attente', async () => {
    const { demande, demandeur, marque } = await demandeEnAttente('marque-geree');
    const orpheline = await creerMarque('marque-sans-proprietaire');
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);
    await decider(requete('POST', { decision: 'APPROVED' }), { params: { id: demande.id } });

    const r = await studios(requete('GET'), {});
    expect(r.status).toBe(200);
    const { data, enAttente } = await r.json();
    const slugs = data.map((s: { slug: string }) => s.slug);
    expect(slugs).toContain(marque.slug);
    expect(slugs).not.toContain(orpheline.slug);
    expect(data.find((s: { slug: string }) => s.slug === marque.slug).owners[0].user.email).toBe(demandeur.email);
    expect(typeof enAttente).toBe('number');
  });
});
