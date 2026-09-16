/**
 * Tests des gardes d'autorisation (REBUILD.md T6.2).
 *
 * Ce qu'on vérifie n'est pas que « ça marche », mais que **ça refuse** : un non-admin
 * reçoit 403, un compte désactivé reçoit 401, un `VIEWER` ne peut pas écrire. Ce sont
 * les chemins dont la casse silencieuse coûte le plus cher — une garde qui laisse
 * passer ne lève aucune erreur, elle laisse passer.
 *
 * La session et la base sont simulées : on teste la logique de la garde, pas NextAuth
 * ni Prisma. Le point décisif — le rôle est **relu en base**, jamais pris dans la
 * session — a son propre test.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('./auth', () => ({ authOptions: {} }));
vi.mock('./db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    brand: { findUnique: vi.fn() },
    brandOwner: { findUnique: vi.fn() },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from './db';
import { HttpError } from './api-response';
import { requireAdmin, requireBrandOwner, requireSuperAdmin, requireUser } from './guards';

const session = vi.mocked(getServerSession);
const findUser = vi.mocked(prisma.user.findUnique);
const findBrand = vi.mocked(prisma.brand.findUnique);
const findOwner = vi.mocked(prisma.brandOwner.findUnique);

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/** Une session pour l'utilisateur `u1`, et un compte en base avec le rôle donné. */
function connecte(role: Role, isActive = true) {
  session.mockResolvedValue({ user: { id: 'u1' } } as never);
  findUser.mockResolvedValue({ id: 'u1', email: 'a@b.fr', name: 'A', role, isActive } as never);
}

/** Attend qu'une promesse échoue avec une HttpError du statut donné. */
async function attendStatut(p: Promise<unknown>, statut: number) {
  await expect(p).rejects.toBeInstanceOf(HttpError);
  await p.catch((e: HttpError) => expect(e.status).toBe(statut));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireUser', () => {
  test('sans session : 401', async () => {
    session.mockResolvedValue(null);
    await attendStatut(requireUser(), 401);
    expect(findUser).not.toHaveBeenCalled();
  });

  test('session sans identifiant : 401', async () => {
    session.mockResolvedValue({ user: {} } as never);
    await attendStatut(requireUser(), 401);
  });

  test('compte introuvable en base : 401', async () => {
    session.mockResolvedValue({ user: { id: 'fantome' } } as never);
    findUser.mockResolvedValue(null);
    await attendStatut(requireUser(), 401);
  });

  test('compte desactive : 401, meme avec une session valide', async () => {
    // Le jeton est une photographie prise a la connexion. Un compte desactive
    // depuis doit etre refuse immediatement, pas a l'expiration du jeton.
    connecte('ADMIN', false);
    await attendStatut(requireUser(), 401);
  });

  test('compte actif : renvoie l utilisateur, et le releve depuis la base', async () => {
    connecte('USER');
    const u = await requireUser();
    expect(u).toEqual({ id: 'u1', email: 'a@b.fr', name: 'A', role: 'USER' });
    expect(findUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });
});

describe('requireAdmin', () => {
  test('USER : 403', async () => {
    connecte('USER');
    await attendStatut(requireAdmin(), 403);
  });

  test('ADMIN et SUPER_ADMIN : passent', async () => {
    connecte('ADMIN');
    expect((await requireAdmin()).role).toBe('ADMIN');
    connecte('SUPER_ADMIN');
    expect((await requireAdmin()).role).toBe('SUPER_ADMIN');
  });

  test('le role vient de la base, pas de la session', async () => {
    // La session pretend etre admin ; la base dit USER. La base gagne.
    session.mockResolvedValue({ user: { id: 'u1', role: 'SUPER_ADMIN' } } as never);
    findUser.mockResolvedValue({ id: 'u1', email: null, name: null, role: 'USER', isActive: true } as never);
    await attendStatut(requireAdmin(), 403);
  });
});

describe('requireSuperAdmin', () => {
  test('ADMIN : 403 — un admin ordinaire ne touche pas aux autres admins', async () => {
    connecte('ADMIN');
    await attendStatut(requireSuperAdmin(), 403);
  });

  test('SUPER_ADMIN : passe', async () => {
    connecte('SUPER_ADMIN');
    expect((await requireSuperAdmin()).role).toBe('SUPER_ADMIN');
  });
});

describe('requireBrandOwner', () => {
  const marque = { id: 'b1', slug: 'ma-marque', name: 'Ma Marque' };
  const lien = (role: string, isActive = true, acceptedAt: Date | null = new Date()) =>
    findOwner.mockResolvedValue({ role, isActive, acceptedAt } as never);

  test('marque inconnue : 404', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(null);
    await attendStatut(requireBrandOwner('inconnue'), 404);
  });

  test('sans lien de propriete : 403', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(marque as never);
    findOwner.mockResolvedValue(null);
    await attendStatut(requireBrandOwner('ma-marque'), 403);
  });

  test('VIEWER : 403 — un role de lecture n autorise jamais une ecriture', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(marque as never);
    lien('VIEWER');
    await attendStatut(requireBrandOwner('ma-marque'), 403);
  });

  test('invitation non acceptee : 403', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(marque as never);
    lien('OWNER', true, null);
    await attendStatut(requireBrandOwner('ma-marque'), 403);
  });

  test('lien desactive : 403', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(marque as never);
    lien('OWNER', false);
    await attendStatut(requireBrandOwner('ma-marque'), 403);
  });

  test('OWNER actif et accepte : passe', async () => {
    connecte('USER');
    findBrand.mockResolvedValue(marque as never);
    lien('OWNER');
    const r = await requireBrandOwner('ma-marque');
    expect(r.brand).toEqual(marque);
    expect(findOwner).toHaveBeenCalledWith(
      expect.objectContaining({ where: { brandId_userId: { brandId: 'b1', userId: 'u1' } } }),
    );
  });

  test('ADMIN : passe sans lien de propriete, et sans le chercher', async () => {
    connecte('ADMIN');
    findBrand.mockResolvedValue(marque as never);
    const r = await requireBrandOwner('ma-marque');
    expect(r.brand.slug).toBe('ma-marque');
    expect(findOwner).not.toHaveBeenCalled();
  });

  test('non connecte : 401 avant meme de chercher la marque', async () => {
    session.mockResolvedValue(null);
    await attendStatut(requireBrandOwner('ma-marque'), 401);
    expect(findBrand).not.toHaveBeenCalled();
  });
});
