import { NextResponse } from 'next/server';

import { route } from '@/lib/api-response';
import { listerProduits, parametresProduits } from '@/lib/catalogue-public';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Liste publique des produits (REBUILD.md T3.4) : recherche, secteur, prix et tri
 * (liste blanche), paginée. Seuls les produits `ACTIVE` sortent.
 */
export const GET = route(async (request: Request) => {
  const p = parametresProduits.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listerProduits(p));
});
