import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Protection des espaces privés (REBUILD.md T4.13).
 *
 * ⚠️ Le middleware précédent ne s'exécutait même pas : il était placé dans
 * `apps/web/middleware.ts` alors que le projet utilise un répertoire `src/`,
 * où Next.js attend `apps/web/src/middleware.ts`. Vérifié : l'en-tête
 * `x-pathname` qu'il prétendait poser n'apparaissait dans aucune réponse.
 * `/admin` et `/studio` étaient donc entièrement ouverts (constat n°2).
 * Cet en-tête n'a pas été reconduit : aucun fichier ne le lisait.
 *
 * ⚠️ Ce contrôle lit le **jeton signé**, pas la base. Il est infalsifiable mais
 * reste une photographie prise à la connexion : c'est une barrière de routage,
 * pas l'autorisation. L'autorisation qui fait foi est `requireAdmin` /
 * `requireBrandOwner` dans les Route Handlers, qui relisent le rôle en base.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname.startsWith('/admin');
  const isStudioArea =
    pathname.startsWith('/studio') &&
    // Ces trois pages sont les points d'entrée : elles doivent rester ouvertes,
    // sans quoi personne ne pourrait jamais se connecter ni revendiquer.
    !pathname.startsWith('/studio/connexion') &&
    !pathname.startsWith('/studio/inscription') &&
    !pathname.startsWith('/studio/revendiquer');

  if (isAdminArea || isStudioArea) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const login = new URL('/connexion', request.url);
      login.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(login);
    }

    if (isAdminArea && token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
      // Compte connecté mais sans les droits : on ne renvoie pas vers la
      // connexion (il y est déjà), on ferme la porte.
      return NextResponse.rewrite(new URL('/404', request.url), { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
