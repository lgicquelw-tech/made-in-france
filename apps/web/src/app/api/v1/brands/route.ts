import { NextResponse } from 'next/server';

import { route } from '@/lib/api-response';
import { listerMarques, parametresMarques } from '@/lib/catalogue-public';

/**
 * Liste publique des marques (REBUILD.md T3.4) : recherche, région et secteur
 * **ensemble**, paginée. Remplace deux routes Express dont l'une ignorait les filtres.
 */
export const GET = route(async (request: Request) => {
  const p = parametresMarques.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listerMarques(p));
});
