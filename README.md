# Made in France

Plateforme de découverte des marques et des produits fabriqués en France : annuaire,
fiches marque et produit, recherche, carte géolocalisée, espace B2B pour les marques.

> **État du projet — 1er septembre 2026.** Le projet est en **reconstruction contrôlée**.
> Il fonctionne en local mais n'est pas déployable en l'état : l'API n'a aucune
> authentification et il n'existe aucun test. Le plan de travail est dans
> [`REBUILD.md`](REBUILD.md), les règles permanentes dans [`CLAUDE.md`](CLAUDE.md).
>
> Ce `README` décrit ce que le code fait **réellement**. La version précédente décrivait
> NestJS, FastAPI, Meilisearch, Redis et un service IA Python — rien de tout cela n'a
> jamais existé dans ce dépôt.

---

## Stack

| Couche | Technologie |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Node | 22 (épinglé par `.nvmrc`), pnpm 9.1.0 |
| Frontend | Next.js 14.2 (App Router), React 18, TypeScript 5.4, Tailwind 3.4 |
| Backend | **Express 4** — un seul fichier, `apps/api/src/index.ts` |
| Base | PostgreSQL 16 + Prisma 5.22 |
| Recherche | PostgreSQL `pg_trgm` (index GIN trigram) |
| Authentification | NextAuth v4 (Google, Email, Credentials) — **côté web uniquement** |
| IA | SDK Anthropic (Claude Haiku) |
| Images | Cloudinary |
| Cartes | Mapbox GL JS |
| Paiement | Stripe (clés de test) |
| UI | Radix, lucide-react, Tiptap, Recharts, framer-motion |

Déclarés dans les dépendances mais **jamais utilisés** : Mistral, Apple OAuth, PostHog,
Resend. `pgvector` n'est pas installé : il n'y a pas de recherche sémantique.

## Structure

```
made-in-france/
├── apps/
│   ├── web/                    # Next.js — 45 pages
│   │   ├── middleware.ts       # ne protège rien, pose un header x-pathname
│   │   └── src/app/
│   │       ├── admin/          # back-office
│   │       ├── studio/         # espace marque B2B — LE seul
│   │       ├── entreprises/    # landing marketing B2B (sans inscription)
│   │       ├── marques/ produits/ secteurs/ regions/ carte/ recherche/
│   │       └── api/auth/[...nextauth]/route.ts   # seule route API côté web
│   └── api/src/index.ts        # 4 358 lignes, 92 routes
├── packages/
│   ├── database/               # schema.prisma — 33 modèles, migrations
│   └── shared/                 # types et constantes partagés
├── scripts/                    # imports, scrapers, enrichissement, statistiques
├── data/brands.xlsx            # 903 marques — seule source de données versionnée
└── docs/archive/               # documents historiques, non fiables
```

## Démarrer

**Prérequis** : Node 22, pnpm 9.1.0, PostgreSQL 16.

Sur macOS avec Homebrew :

```bash
brew install postgresql@16 fnm
fnm install 22 && fnm use 22
corepack enable && corepack prepare pnpm@9.1.0 --activate
```

**Démarrer PostgreSQL.** `LC_ALL` est obligatoire : sans lui le serveur refuse de
démarrer avec `postmaster became multithreaded during startup`.

```bash
LC_ALL=C /opt/homebrew/opt/postgresql@16/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start
```

Une machine équipée de Docker peut utiliser `docker compose up -d postgres` à la place.

**Créer le rôle et la base**, en accord avec le `DATABASE_URL` du `.env` :

```bash
createuser mif_user --createdb --pwprompt
createdb -O mif_user madeinfrance
```

**Monter le projet** — une seule commande : installation, génération Prisma, migration,
seed, puis import des 903 marques de `data/brands.xlsx`. Elle est idempotente.

```bash
cp .env.example .env      # puis renseigner les valeurs
pnpm bootstrap
```

> ⚠️ **`pnpm bootstrap`, pas `pnpm setup`.** `setup` est une commande **interne** de pnpm
> qui masque silencieusement tout script du même nom — et qui écrit dans votre `~/.zshrc`.

**Lancer :**

```bash
pnpm dev        # web sur :3000, api sur :4000
```

## Commandes

```bash
pnpm dev                  # web + api
pnpm --filter @mif/web dev
pnpm --filter @mif/api dev

pnpm typecheck            # api, shared et database passent ; web a encore 12 erreurs
pnpm lint

pnpm db:generate          # client Prisma
pnpm db:migrate           # migration de développement
pnpm db:seed              # données de démarrage
pnpm db:import            # import des marques depuis data/brands.xlsx (idempotent)

pnpm admin:create         # crée (ou promeut) un compte administrateur
pnpm db:studio            # Prisma Studio
```

`prisma db push` est **interdit** sur ce projet : le schéma et les migrations avaient
divergé en janvier 2026, faisant perdre trois tables. Uniquement `prisma migrate`.

## Variables d'environnement

Deux fichiers réels, tous deux ignorés par git :

- **`.env`** à la racine — base de données, services, clés serveur. Toutes les commandes
  `db:*` tournent depuis la racine pour le lire directement. `apps/api/.env` et
  `apps/web/.env` sont des liens symboliques vers lui : pratiques, mais **ignorés par
  git**, donc absents d'un clone neuf. Ne rien faire qui en dépende.
- **`apps/web/.env.local`** — NextAuth (`NEXTAUTH_SECRET`, OAuth Google, SMTP).

`.env.example` liste toutes les clés attendues, sans aucune valeur.

## Tests

**Il n'y en a aucun.** `turbo.json` déclare des tâches `test` et `test:e2e` qui ne
pointent sur rien. Vitest et Playwright sont prévus en phase 6 de `REBUILD.md`.

## Limites connues

Elles sont documentées et suivies dans [`REBUILD.md`](REBUILD.md) :

- L'API Express **n'a aucune authentification** — les 92 routes sont ouvertes, dont
  l'administration. Ne pas exposer ce service.
- L'administration côté web n'est protégée que par un `localStorage`.
- L'identité circule encore en query string sur certaines routes.
- 42 des 45 pages sont en `'use client'`, avec un seul `generateMetadata` : le site est
  quasiment invisible pour les moteurs de recherche.
- Les statistiques affichées aux marques sont générées par `Math.random()`.
- La base de données locale est repartie de zéro : le catalogue produit de janvier 2026
  a été perdu, faute de sauvegarde.

## Documentation

| Fichier | Rôle |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Contexte permanent et règles non négociables |
| [`REBUILD.md`](REBUILD.md) | Plan de reconstruction, phases et journal de sessions |
| `docs/archive/` | Documents historiques — **non fiables**, ne pas s'en servir comme source |
