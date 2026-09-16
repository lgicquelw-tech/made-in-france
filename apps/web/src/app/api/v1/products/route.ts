import { NextResponse } from 'next/server';

import { route } from '@/lib/api-response';
import { listerProduits, parametresProduits } from '@/lib/catalogue-public';

/**
 * Liste publique des produits (REBUILD.md T3.4) : recherche, secteur, prix et tri
 * (liste blanche), paginée. Seuls les produits `ACTIVE` sortent.
 */
export const GET = route(async (request: Request) => {
  const p = parametresProduits.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await listerProduits(p));
});
