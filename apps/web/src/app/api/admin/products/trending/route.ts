import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Produits mis en avant. Migré depuis Express.
 *
 * Côté Express, cette route devait impérativement être déclarée AVANT
 * `/:id`, sinon le paramètre dynamique avalait le mot « trending »
 * (piège documenté dans CLAUDE.md). En App Router, un segment statique prime
 * toujours sur un segment dynamique : le piège disparaît avec la migration.
 */
export const GET = route(async () => {
  await requireAdmin();

  const products = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { updatedAt: 'desc' },
    include: { brand: { include: { sector: true } } },
  });

  return NextResponse.json({ data: products });
});
