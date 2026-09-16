/**
 * Les favoris, sur une vraie base (REBUILD.md T6.3).
 *
 * Ce qu'on vérifie : les points sont crédités **une fois** par favori — l'ancienne
 * route les incrémentait à chaque appel — et l'identité vient de la session : deux
 * utilisateurs ne voient jamais les favoris l'un de l'autre.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as lister, POST as ajouter } from '@/app/api/v1/me/favorites/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

describe('favoris', () => {
  test('ajouter credite 5 points, une seule fois', async () => {
    const u = await creerUtilisateur('USER');
    const m = await creerMarque();
    sessionDe(u.id);

    const r1 = await ajouter(requete('POST', { brandId: m.id }), {});
    expect(r1.status).toBe(201);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.points).toBe(u.points + 5);

    // Le meme favori une seconde fois : pas de doublon, pas de points.
    const r2 = await ajouter(requete('POST', { brandId: m.id }), {});
    expect(r2.status).toBe(200);
    expect((await r2.json()).alreadyFavorite).toBe(true);
    expect(await prisma.favorite.count({ where: { userId: u.id } })).toBe(1);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.points).toBe(u.points + 5);
  });

  test('chacun ne voit que les siens', async () => {
    const a = await creerUtilisateur('USER', 'a');
    const b = await creerUtilisateur('USER', 'b');
    const m1 = await creerMarque('m1');
    const m2 = await creerMarque('m2');
    sessionDe(a.id); await ajouter(requete('POST', { brandId: m1.id }), {});
    sessionDe(b.id); await ajouter(requete('POST', { brandId: m2.id }), {});

    sessionDe(a.id);
    const deA = (await (await lister(requete('GET'), {})).json()).data;
    expect(deA.map((f: { brandId: string }) => f.brandId)).toEqual([m1.id]);
  });

  test('une marque inexistante : 404, aucun point', async () => {
    const u = await creerUtilisateur('USER');
    sessionDe(u.id);
    const r = await ajouter(requete('POST', { brandId: '00000000-0000-4000-8000-000000000000' }), {});
    expect(r.status).toBe(404);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.points).toBe(u.points);
  });

  test('un identifiant qui n est pas un UUID : 400 avant toute lecture', async () => {
    const u = await creerUtilisateur('USER');
    sessionDe(u.id);
    const r = await ajouter(requete('POST', { brandId: "'; DROP TABLE brands; --" }), {});
    expect(r.status).toBe(400);
  });

  test('sans session : 401', async () => {
    sessionDe(null);
    expect((await lister(requete('GET'), {})).status).toBe(401);
  });
});
