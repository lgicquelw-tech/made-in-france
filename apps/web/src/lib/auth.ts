import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import { prisma } from './db';

/**
 * Configuration NextAuth, extraite de la route pour être réutilisable par
 * `getServerSession` dans les Route Handlers et les Server Components.
 *
 * Les traces de débogage qui journalisaient l'e-mail saisi et l'existence d'un
 * mot de passe ont été retirées : ce sont des données personnelles, et elles
 * renseignaient un attaquant sur la validité d'un compte.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Même réponse pour « compte inconnu », « compte sans mot de passe »,
        // « compte désactivé » et « mot de passe faux » : rien ne doit
        // permettre de distinguer ces cas de l'extérieur.
        if (!user || !user.password || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/connexion',
    error: '/connexion',
  },

  callbacks: {
    async jwt({ token, user }) {
      // À la connexion seulement : on inscrit l'identifiant et le rôle.
      // Le rôle porté par le jeton n'autorise rien par lui-même — il évite
      // simplement au frontend de deviner quoi afficher. Voir `guards.ts`.
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'USER';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? '';
        session.user.role = token.role ?? 'USER';
      }
      return session;
    },
  },
};
