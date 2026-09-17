/**
 * La piste d'audit, sur une vraie base (REBUILD.md T3.14).
 *
 * Ce qui est vérifié : chaque écriture laisse une trace ; la trace ne porte que les
 * champs modifiés ; jamais un secret ; l'acteur est celui de la session ; une écriture
 * qui échoue ne laisse pas de trace (même transaction) ; la lecture est réservée.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { PUT as modifierMarque, DELETE as supprimerMarque } from '@/app/api/admin/brands/[id]/route';
import { PUT as modifierDepuisStudio } from '@/app/api/v1/brands/[slug]/dashboard/route';
import { GET as lireAudit } from '@/app/api/admin/audit/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

const vider = () => prisma.auditLog.deleteMany();

describe('piste d audit', () => {
  test('une modification admin laisse UNE trace, avec les seuls champs modifies, et l acteur', async () => {
    await vider();
    const admin = await creerUtilisateur('ADMIN'); sessionDe(admin.id);
    const m = await creerMarque('tracee');
    await prisma.brand.update({ where: { id: m.id }, data: { city: 'Rennes', stripeCustomerId: 'cus_SECRET' } });

    const r = await modifierMarque(requete('PUT', { city: 'Brest', descriptionShort: 'Nouvelle description, assez longue pour être utile.' }), { params: { id: m.id } });
    expect(r.status).toBe(200);

    const traces = await prisma.auditLog.findMany({ where: { targetId: m.id } });
    expect(traces).toHaveLength(1);
    const t = traces[0];
    expect(t.action).toBe('brand.update');
    expect(t.userId).toBe(admin.id);
    expect(t.userEmail).toBe(admin.email);
    expect(t.targetLabel).toBe(m.name);
    const changes = t.changes as Record<string, { avant: unknown; apres: unknown }>;
    expect(changes.city).toEqual({ avant: 'Rennes', apres: 'Brest' });
    expect(changes.descriptionShort.apres).toContain('Nouvelle description');
    expect(Object.keys(changes)).not.toContain('name'); // inchange : absent
    expect(JSON.stringify(changes)).not.toContain('SECRET');
  });

  test('une suppression garde l etat complet de la fiche, sans secret', async () => {
    await vider();
    const sa = await creerUtilisateur('SUPER_ADMIN'); sessionDe(sa.id);
    const m = await creerMarque('condamnee');
    await prisma.brand.update({ where: { id: m.id }, data: { city: 'Nantes', stripeSubscriptionId: 'sub_SECRET' } });
    expect((await supprimerMarque(requete('DELETE'), { params: { id: m.id } })).status).toBe(200);

    const t = await prisma.auditLog.findFirst({ where: { targetId: m.id } });
    expect(t!.action).toBe('brand.delete');
    expect(t!.targetLabel).toBe(m.name);
    const changes = t!.changes as Record<string, { avant: unknown; apres: unknown }>;
    expect(changes.city).toEqual({ avant: 'Nantes', apres: null });
    expect(JSON.stringify(changes)).not.toContain('SECRET');
    expect(await prisma.brand.count({ where: { id: m.id } })).toBe(0);
  });

  test('une modification depuis le Studio porte l identite du proprietaire', async () => {
    await vider();
    const m = await creerMarque('la-mienne');
    const u = await creerUtilisateur('USER');
    await prisma.brandOwner.create({ data: { brandId: m.id, userId: u.id, role: 'OWNER', isActive: true, acceptedAt: new Date() } });
    sessionDe(u.id);
    const r = await modifierDepuisStudio(requete('PUT', { city: 'Lorient' }), { params: { slug: 'la-mienne' } });
    expect(r.status).toBe(200);
    const t = await prisma.auditLog.findFirst({ where: { targetId: m.id } });
    expect(t!.userId).toBe(u.id);
    expect((t!.changes as Record<string, unknown>).city).toEqual({ avant: null, apres: 'Lorient' });
  });

  test('une ecriture qui echoue ne laisse AUCUNE trace', async () => {
    await vider();
    const admin = await creerUtilisateur('ADMIN'); sessionDe(admin.id);
    const a = await creerMarque('prise');
    const b = await creerMarque('candidate');
    // Slug deja pris : l'update viole l'unicite et echoue dans la transaction.
    const r = await modifierMarque(requete('PUT', { slug: a.slug }), { params: { id: b.id } });
    expect(r.status).toBe(500);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  test('la lecture est reservee aux administrateurs, et filtre par fiche', async () => {
    await vider();
    const admin = await creerUtilisateur('ADMIN'); sessionDe(admin.id);
    const m1 = await creerMarque('m1'); const m2 = await creerMarque('m2');
    await modifierMarque(requete('PUT', { city: 'A' }), { params: { id: m1.id } });
    await modifierMarque(requete('PUT', { city: 'B' }), { params: { id: m2.id } });

    const tout = await (await lireAudit(new Request('http://t/api/admin/audit'), {})).json();
    expect(tout.pagination.total).toBe(2);
    const unSeul = await (await lireAudit(new Request(`http://t/api/admin/audit?targetType=brand&targetId=${m1.id}`), {})).json();
    expect(unSeul.data).toHaveLength(1);

    const u = await creerUtilisateur('USER'); sessionDe(u.id);
    expect((await lireAudit(new Request('http://t/api/admin/audit'), {})).status).toBe(403);
  });
});
