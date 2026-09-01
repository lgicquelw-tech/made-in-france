import { getServerSession } from 'next-auth';

import { authOptions } from './auth';
import { prisma } from './db';
import { forbidden, notFound, unauthorized } from './api-response';

/**
 * Gardes d'autorisation (REBUILD.md T3.11).
 *
 * Deux règles gouvernent ce fichier :
 *
 * 1. **L'identité vient de la session, jamais du client.** Aucun `userId`,
 *    e-mail ou rôle lu dans la query string, le corps ou un en-tête applicatif
 *    n'est une preuve d'identité (CLAUDE.md, règle 2).
 * 2. **Le rôle est relu en base à chaque requête.** Le jeton JWT est signé,
 *    donc infalsifiable, mais il reste une photographie prise à la connexion :
 *    un compte rétrogradé ou désactivé garderait sinon ses droits jusqu'à
 *    l'expiration du jeton.
 */

export type AuthedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
};

async function currentUser(): Promise<AuthedUser | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Exige un compte connecté et actif. Lève 401 sinon. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await currentUser();
  if (!user) throw unauthorized();
  return user;
}

/** Exige un rôle d'administration. Lève 401 si non connecté, 403 sinon. */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw forbidden("Cette action demande un rôle d'administration.");
  }
  return user;
}

/** Réservé aux actions irréversibles ou touchant les autres administrateurs. */
export async function requireSuperAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') {
    throw forbidden('Cette action est réservée au super-administrateur.');
  }
  return user;
}

export type OwnedBrand = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Exige que l'utilisateur connecté soit propriétaire de la marque `slug`,
 * vérifié **en base** via `brand_owners` (CLAUDE.md, règle 1).
 * Un administrateur passe aussi, sans lien de propriété.
 *
 * `VIEWER` est explicitement exclu : c'est un rôle de lecture, il ne doit
 * jamais autoriser une écriture.
 */
export async function requireBrandOwner(
  slug: string
): Promise<{ user: AuthedUser; brand: OwnedBrand }> {
  const user = await requireUser();

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
  if (!brand) throw notFound('Marque introuvable');

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return { user, brand };
  }

  const membership = await prisma.brandOwner.findUnique({
    where: { brandId_userId: { brandId: brand.id, userId: user.id } },
    select: { role: true, isActive: true, acceptedAt: true },
  });

  const canWrite =
    membership !== null &&
    membership.isActive &&
    membership.acceptedAt !== null &&
    membership.role !== 'VIEWER';

  if (!canWrite) {
    throw forbidden("Vous n'êtes pas autorisé à modifier cette marque.");
  }

  return { user, brand };
}
