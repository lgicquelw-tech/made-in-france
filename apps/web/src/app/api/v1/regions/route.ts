import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route } from '@/lib/api-response';

/** Référentiel regions, trié par nom (REBUILD.md T3.8). */
export const GET = route(async () => {
  const data = await prisma.region.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ data });
});
