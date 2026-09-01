import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

/**
 * NextAuth ne connaît par défaut ni `id` ni `role` sur la session.
 * Le code les utilisait quand même : c'était la cause de la majorité des
 * erreurs de `pnpm typecheck` sur @mif/web.
 *
 * ⚠️ Déclarer un type ne prouve rien. Le `role` porté par la session sert au
 * confort d'affichage ; l'autorisation, elle, est toujours revérifiée en base
 * (voir `lib/guards.ts`).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
