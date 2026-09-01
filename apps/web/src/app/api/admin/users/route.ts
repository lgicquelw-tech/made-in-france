import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

/**
 * Liste des utilisateurs (administration).
 *
 * ⚠️ Cette route **n'existait pas**. La page `/admin/utilisateurs` l'appelait,
 * recevait une 404, et affichait cinq utilisateurs fictifs — noms et adresses
 * e-mail vraisemblables compris. Elle renvoie désormais la base réelle.
 *
 * Le mot de passe (même haché) n'est jamais sélectionné : il n'a aucune raison
 * de traverser le réseau.
 */

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(''),
  filter: z.enum(['', 'all', 'admins', 'owners']).default(''),
});

export const GET = route(async (request: Request) => {
  await requireAdmin();

  const url = new URL(request.url);
  const { page, limit, search, filter } = querySchema.parse(
    Object.fromEntries(url.searchParams)
  );

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(filter === 'admins' ? { role: { in: ['ADMIN', 'SUPER_ADMIN'] as const } } : {}),
    ...(filter === 'owners' ? { ownedBrands: { some: {} } } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        points: true,
        rank: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { favorites: true, brandViews: true, ownedBrands: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
