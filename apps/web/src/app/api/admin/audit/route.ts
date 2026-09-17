import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Lecture de la piste d'audit (REBUILD.md T3.14) : les dernières écritures, ou celles
 * d'une fiche donnée. Réservée aux administrateurs — la piste dit qui a fait quoi.
 */
const parametres = z.object({
  targetType: z.enum(['brand', 'product', 'user', 'label', 'collection']).optional(),
  targetId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = route(async (request: Request) => {
  await requireAdmin();
  const p = parametres.parse(Object.fromEntries(new URL(request.url).searchParams));
  const where = { ...(p.targetType && { targetType: p.targetType }), ...(p.targetId && { targetId: p.targetId }), ...(p.userId && { userId: p.userId }) };
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (p.page - 1) * p.limit, take: p.limit }),
    prisma.auditLog.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page: p.page, limit: p.limit, total, totalPages: Math.max(1, Math.ceil(total / p.limit)) } });
});
