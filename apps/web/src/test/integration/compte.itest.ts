/**
 * Export et suppression du compte, sur une vraie base (REBUILD.md T7.5).
 *
 * Ce qu'on vérifie : l'export ne contient que **ses** données et jamais le mot de passe
 * haché ; la suppression emporte favoris et historique, laisse les marques intactes,
 * détache et anonymise les demandes de revendication, et laisse une trace d'audit
 * **sans l'adresse e-mail** qu'on vient d'effacer.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as exporter } from '@/app/api/v1/me/export/route';
import { DELETE as supprimer } from '@/app/api/v1/me/route';
import { POST as ajouterFavori } from '@/app/api/v1/me/favorites/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

describe('export des données', () => {
  test('ses favoris, sa demande, pas le mot de passe, pas les autres', async () => {
    const moi = await creerUtilisateur('USER', 'moi');
    const autre = await creerUtilisateur('USER', 'autre');
    const m1 = await creerMarque('m1');
    const m2 = await creerMarque('m2');
    sessionDe(autre.id); await ajouterFavori(requete('POST', { brandId: m2.id }), {});
    sessionDe(moi.id); await ajouterFavori(requete('POST', { brandId: m1.id }), {});
    await prisma.brandClaimRequest.create({ data: {
      brandId: m1.id, userId: moi.id, email: moi.email!, firstName: 'Moi', lastName: 'Même', proofType: 'declaration', status: 'PENDING',
    } });

    const r = await exporter(requete('GET'), {});
    expect(r.status).toBe(200);
    expect(r.headers.get('content-disposition')).toMatch(/attachment; filename="made-in-france-mes-donnees-/);
    const texte = await r.text();
    const donnees = JSON.parse(texte);

    expect(donnees.compte.email).toBe(moi.email);
    expect(donnees.favoris.map((f: { slug: string }) => f.slug)).toEqual(['m1']);
    expect(donnees.demandesDeRevendication).toHaveLength(1);
    expect(donnees.demandesDeRevendication[0].statut).toBe('PENDING');
    // Rien de l'autre, rien du secret.
    expect(texte).not.toContain(autre.email!);
    expect(texte).not.toContain('m2');
    expect(texte.toLowerCase()).not.toContain('password');
    expect(texte).not.toContain('$2'); // préfixe d'un haché bcrypt
  });

  test('anonyme : 401', async () => {
    sessionDe(null);
    expect((await exporter(requete('GET'), {})).status).toBe(401);
  });
});

describe('suppression du compte', () => {
  test('emporte les siens, laisse les marques, trace sans e-mail', async () => {
    const moi = await creerUtilisateur('USER', 'suppr');
    const m = await creerMarque('gardee');
    sessionDe(moi.id);
    await ajouterFavori(requete('POST', { brandId: m.id }), {});
    await prisma.brandView.create({ data: { userId: moi.id, brandId: m.id } });
    const demande = await prisma.brandClaimRequest.create({ data: {
      brandId: m.id, userId: moi.id, email: moi.email!, firstName: 'Prénom', lastName: 'Nom', phone: '0600000000', proofType: 'declaration',
    } });

    const r = await supprimer(requete('DELETE'), {});
    expect(r.status).toBe(200);

    expect(await prisma.user.findUnique({ where: { id: moi.id } })).toBeNull();
    expect(await prisma.favorite.count({ where: { userId: moi.id } })).toBe(0);
    expect(await prisma.brandView.count({ where: { userId: moi.id } })).toBe(0);
    expect(await prisma.brand.findUnique({ where: { id: m.id } })).not.toBeNull();

    // La demande reste — décision sur la marque — mais ne dit plus qui.
    const apres = await prisma.brandClaimRequest.findUniqueOrThrow({ where: { id: demande.id } });
    expect(apres.userId).toBeNull();
    expect(apres.email).not.toBe(moi.email);
    expect(apres.phone).toBeNull();
    expect(apres.firstName).toBe('—');

    const trace = await prisma.auditLog.findFirst({ where: { action: 'user.delete', targetId: moi.id } });
    expect(trace).not.toBeNull();
    expect(trace!.userEmail).toBeNull();
    expect(JSON.stringify(trace!.changes)).not.toContain(moi.email!);
  });

  test('anonyme : 401, et rien ne bouge', async () => {
    const avant = await prisma.user.count();
    sessionDe(null);
    expect((await supprimer(requete('DELETE'), {})).status).toBe(401);
    expect(await prisma.user.count()).toBe(avant);
  });
});
