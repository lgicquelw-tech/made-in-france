import { vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

/** Outils partagés par les tests d'intégration : session simulée, données réelles. */

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

/** La session dit « je suis `id` ». Rien d'autre : le rôle vient de la base. */
export function sessionDe(id: string | null): void {
  vi.mocked(getServerSession).mockResolvedValue(id ? ({ user: { id } } as never) : null);
}

export async function creerUtilisateur(role: Role = 'USER', suffixe = Math.random().toString(36).slice(2)) {
  const email = `${role.toLowerCase()}-${suffixe}@test.local`;
  const u = await prisma.user.create({
    data: { email, name: `Test ${role}`, role, isActive: true },
    select: { id: true, role: true, points: true },
  });
  // `email` est nullable en base ; ici on vient de le poser, il est donc connu.
  return { ...u, email };
}

export async function creerMarque(slug = `marque-${Math.random().toString(36).slice(2)}`) {
  return prisma.brand.create({
    data: { name: slug.toUpperCase(), slug, status: 'ACTIVE' },
    select: { id: true, slug: true, name: true },
  });
}

/** Une requête JSON, avec une adresse IP distincte pour ne pas heurter le limiteur. */
export function requete(methode: string, corps?: unknown, ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`): Request {
  return new Request('http://test.local/api', {
    method: methode,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
}
