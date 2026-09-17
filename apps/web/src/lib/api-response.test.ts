/**
 * Tests de l'enveloppe de réponse (REBUILD.md T6.2).
 *
 * La règle testée : **un défaut interne ne dit jamais au client ce qui a échoué.**
 * Une garde qui lève 403 doit produire une 403 ; une exception inattendue doit
 * produire une 500 au message générique, sans la moindre trace de la cause.
 */

import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { HttpError, badRequest, forbidden, notFound, route, toErrorResponse, unauthorized } from './api-response';

describe('toErrorResponse', () => {
  test('une HttpError garde son statut et son message', async () => {
    for (const [err, statut] of [
      [unauthorized(), 401], [forbidden('non'), 403], [notFound(), 404], [badRequest(), 400],
    ] as const) {
      const r = toErrorResponse(err);
      expect(r.status).toBe(statut);
      expect((await r.json()).error).toBe(err.message);
    }
  });

  test('une erreur Zod : 400 avec le detail par champ — c est une erreur du client', async () => {
    const parse = z.object({ nom: z.string().min(1) }).safeParse({ nom: '' });
    expect(parse.success).toBe(false);
    const r = toErrorResponse((parse as { error: unknown }).error);
    expect(r.status).toBe(400);
    const corps = await r.json();
    expect(corps.details).toHaveProperty('nom');
  });

  test('une exception inattendue : 500 generique, sans la cause', async () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = toErrorResponse(new Error('ECONNREFUSED postgres://mif_user:secret@db'));
    expect(r.status).toBe(500);
    const corps = await r.json();
    expect(corps).toEqual({ error: 'Erreur serveur' });
    expect(JSON.stringify(corps)).not.toContain('secret');
    expect(silence).toHaveBeenCalled(); // journalisee cote serveur, elle
    silence.mockRestore();
  });
});

describe('route', () => {
  test('un throw dans le handler devient la bonne reponse HTTP', async () => {
    const h = route(async () => { throw forbidden(); });
    const r = await h(new Request('http://x'), {});
    expect(r.status).toBe(403);
  });

  test('un handler qui reussit passe tel quel', async () => {
    const h = route(async () => new Response('ok', { status: 201 }));
    const r = await h(new Request('http://x'), {});
    expect(r.status).toBe(201);
  });

  test('HttpError est bien une Error, avec son nom', () => {
    const e = new HttpError(418, 'thé');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('HttpError');
  });
});

describe('signaux internes de Next', () => {
  test('DYNAMIC_SERVER_USAGE traverse l enveloppe au lieu de devenir une 500', async () => {
    // C'est ainsi que Next apprend qu'une route lit les en-tetes et ne doit pas etre
    // rendue au build. L'attraper figeait une 500 JSON dans le build (17 sept. 2026).
    const signal = Object.assign(new Error('Dynamic server usage'), { digest: 'DYNAMIC_SERVER_USAGE' });
    expect(() => toErrorResponse(signal)).toThrow(signal);
    const h = route(async () => { throw signal; });
    await expect(h(new Request('http://x'), {})).rejects.toBe(signal);
  });
  test('NEXT_NOT_FOUND et NEXT_REDIRECT aussi', () => {
    for (const digest of ['NEXT_NOT_FOUND', 'NEXT_REDIRECT;replace;/x;307;']) {
      const signal = Object.assign(new Error(digest), { digest });
      expect(() => toErrorResponse(signal)).toThrow(signal);
    }
  });
  test('un digest quelconque n est PAS un signal : 500 generique', async () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = toErrorResponse(Object.assign(new Error('x'), { digest: 'autre-chose' }));
    expect(r.status).toBe(500);
    silence.mockRestore();
  });
});
