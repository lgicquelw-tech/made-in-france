import type { Prisma, PrismaClient } from '@prisma/client';

import type { AuthedUser } from './guards';

/**
 * Piste d'audit (REBUILD.md T3.14) : qui a modifié quoi, quand.
 *
 * Deux règles :
 *
 *   1. **Uniquement les champs modifiés.** Une fiche marque a quarante champs ; en
 *      stocker l'intégralité à chaque enregistrement rendrait la piste illisible et
 *      lourde. On compare avant / après et on garde ce qui a changé.
 *   2. **Jamais un secret.** Mots de passe, identifiants Stripe, affiliation : exclus
 *      quoi qu'il arrive (règle 4). Les textes longs sont tronqués — la piste dit *que*
 *      la description a changé et par qui, pas besoin des 4 000 caractères.
 *
 * L'écriture et sa trace se font dans la **même transaction** (`journaliser(tx, …)`) :
 * une modification sans trace, ou une trace sans modification, est impossible.
 */

const CHAMPS_EXCLUS = new Set([
  'password', 'stripeCustomerId', 'stripeSubscriptionId', 'affiliateId', 'affiliateBaseUrl',
  'commissionRate', 'updatedAt', 'createdAt',
]);
const LONGUEUR_MAX = 300;

export type Changements = Record<string, { avant: unknown; apres: unknown }>;

function compacter(v: unknown): unknown {
  if (typeof v === 'string' && v.length > LONGUEUR_MAX) return `${v.slice(0, LONGUEUR_MAX)}… (${v.length} caractères)`;
  if (v instanceof Date) return v.toISOString();
  return v === undefined ? null : v;
}

const memes = (a: unknown, b: unknown): boolean => JSON.stringify(compacter(a)) === JSON.stringify(compacter(b));

/** Les champs qui diffèrent entre deux états, hors secrets, valeurs compactées. */
export function differences(avant: Record<string, unknown> | null, apres: Record<string, unknown> | null): Changements {
  const cles = new Set([...Object.keys(avant ?? {}), ...Object.keys(apres ?? {})]);
  const c: Changements = {};
  for (const k of cles) {
    if (CHAMPS_EXCLUS.has(k)) continue;
    const a = avant?.[k], b = apres?.[k];
    if (avant && apres && memes(a, b)) continue;
    c[k] = { avant: compacter(a), apres: compacter(b) };
  }
  return c;
}

export interface Entree {
  acteur: AuthedUser | null;
  action: string;
  cible: { type: 'brand' | 'product' | 'user' | 'label' | 'collection'; id: string; libelle?: string | null };
  avant?: Record<string, unknown> | null;
  apres?: Record<string, unknown> | null;
  /** Pour les actions sans avant/après (suppression en masse, changement de palier). */
  changements?: Changements;
}

type Client = PrismaClient | Prisma.TransactionClient;

/** Écrit une ligne d'audit. À appeler dans la transaction de l'écriture qu'elle trace. */
export async function journaliser(client: Client, e: Entree): Promise<void> {
  const changes = e.changements ?? differences(e.avant ?? null, e.apres ?? null);
  await client.auditLog.create({
    data: {
      userId: e.acteur?.id ?? null,
      userEmail: e.acteur?.email ?? null,
      action: e.action,
      targetType: e.cible.type,
      targetId: e.cible.id,
      targetLabel: e.cible.libelle ?? null,
      changes: changes as Prisma.InputJsonValue,
    },
  });
}
