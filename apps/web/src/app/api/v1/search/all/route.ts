import { NextResponse } from 'next/server';
import { z } from 'zod';

import { route } from '@/lib/api-response';
import { rechercher } from '@/lib/search';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Recherche unifiée marques + produits (REBUILD.md T3.4). Sert la barre d'en-tête
 * (5 résultats) et la page `/recherche` quand on retape (20). Migrée depuis Express ;
 * même chemin, pour que les clients passent en URL relative.
 */

const parametres = z.object({
  q: z.string().trim().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = route(async (request: Request) => {
  const { q, limit } = parametres.parse(Object.fromEntries(new URL(request.url).searchParams));
  const resultats = await rechercher(q, limit);
  return NextResponse.json({ ...resultats, query: q });
});
