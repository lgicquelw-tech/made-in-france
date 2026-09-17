import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/** Référentiel sectors, trié par nom (REBUILD.md T3.8). */
export const GET = route(async () => {
  const data = await prisma.sector.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ data });
});
