import { NextResponse } from 'next/server';

import { route } from '@/lib/api-response';
import { lireFil, parametresFil } from '@/lib/feed';

export const dynamic = 'force-dynamic';

/**
 * Le fil de produits (REBUILD.md T8.9). Les préférences arrivent en query string
 * (`s`, `m`, `q` : secteurs, marques, mots), servent à ordonner, et ne sont pas stockées.
 */
export const GET = route(async (request: Request) => {
  const p = parametresFil.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { data, total, personnalise } = await lireFil(p);
  return NextResponse.json({ data, personnalise, pagination: { page: p.page, limit: p.limit, total, totalPages: Math.max(1, Math.ceil(total / p.limit)) } });
});
