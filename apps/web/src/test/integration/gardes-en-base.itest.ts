/**
 * Les gardes, sur une vraie base (REBUILD.md T6.3).
 *
 * Les tests unitaires de `guards.test.ts` simulent Prisma. Ceux-ci non : le rôle est
 * réellement lu dans `users`. Le scénario qui justifie tout le fichier est le dernier —
 * un administrateur **rétrogradé en base** pendant que sa session reste valide doit
 * être refusé à la requête suivante.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as listerMarques } from '@/app/api/admin/brands/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

describe('GET /api/admin/brands', () => {
  test('sans session : 401', async () => {
    sessionDe(null);
    const r = await listerMarques(requete('GET'), {});
    expect(r.status).toBe(401);
  });

  test('un USER reel : 403', async () => {
    const u = await creerUtilisateur('USER');
    sessionDe(u.id);
    const r = await listerMarques(requete('GET'), {});
    expect(r.status).toBe(403);
  });

  test('un ADMIN reel : 200, et la liste vient de la base', async () => {
    const admin = await creerUtilisateur('ADMIN');
    const m = await creerMarque('marque-visible');
    sessionDe(admin.id);
    const r = await listerMarques(requete('GET'), {});
    expect(r.status).toBe(200);
    const corps = await r.json();
    expect(JSON.stringify(corps)).toContain(m.slug);
  });

  test('un admin retrograde en base est refuse a la requete suivante, session inchangee', async () => {
    const admin = await creerUtilisateur('ADMIN');
    sessionDe(admin.id);
    expect((await listerMarques(requete('GET'), {})).status).toBe(200);

    // Retrogradation en base — la session, elle, dit toujours la meme chose.
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });
    expect((await listerMarques(requete('GET'), {})).status).toBe(403);

    // Desactivation : 401, le compte n'existe plus pour la garde.
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN', isActive: false } });
    expect((await listerMarques(requete('GET'), {})).status).toBe(401);
  });

  test('une session pour un id qui n existe plus en base : 401', async () => {
    const u = await creerUtilisateur('ADMIN');
    sessionDe(u.id);
    await prisma.user.delete({ where: { id: u.id } });
    expect((await listerMarques(requete('GET'), {})).status).toBe(401);
  });
});
