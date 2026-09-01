# CLAUDE.md — Made in France

> Contexte permanent pour Claude Code. Lis ce fichier avant toute action.
> Le plan de travail détaillé est dans `REBUILD.md`.
> Dernière vérification du contenu de ce fichier contre le code : **1er septembre 2026**.

---

## Le projet en cinq lignes

Plateforme de découverte des marques et produits fabriqués en France : annuaire, fiches marque et produit, recherche, carte géolocalisée, espace B2B pour les marques.

Le projet a été développé sur 18 sessions entre décembre 2025 et janvier 2026, puis arrêté. Il est en **reconstruction contrôlée** : on garde les données, le design et le schéma métier, on refait le socle (backend, base, authentification, tests).

**Nous ne sommes pas en train d'ajouter des fonctionnalités.** Si une demande revient à ajouter une fonctionnalité avant la fin de la phase 7 de `REBUILD.md`, signale-le au lieu de l'implémenter.

---

## ⚠️ La source de vérité est `origin/main`, pas le disque

Le 1er septembre 2026, on a découvert que la copie locale du dépôt était **antérieure**
à ce qui est publié sur GitHub. `origin/main` (`7878ad4`, 17 février 2026) contenait
11 routes et 9 fichiers que le disque n'avait pas : la fonctionnalité **labels**, la page
d'édition produit de l'admin, `regions/outre-mer`, `src/data/regionPaths.ts`, le
`globals.css` complet (720 lignes contre 160) et le GeoJSON de la carte.

L'audit d'août 2026 qui a produit `REBUILD.md` a été fait sur cette copie périmée : sa
volumétrie sous-estime le projet. Les chiffres ci-dessous ont été refaits sur `origin/main`.

**Avant toute analyse : `git fetch && git status`.** Si le local est en retard, s'aligner
d'abord. L'état de janvier a été archivé sur la branche `archive/janvier-2026`.

---

## Documentation : ce qui fait foi

| Document | Statut |
|---|---|
| `CLAUDE.md` (ce fichier) | Contexte permanent et règles. **Fait foi.** |
| `REBUILD.md` | Plan de reconstruction et journal de sessions. **Fait foi.** |
| `docs/SPEC-V1.md` | Périmètre de la v1. **Fait foi.** |
| `README.md` | Réécrit le 1er septembre 2026 à partir du code réel. Fiable. |
| `docs/archive/*` | **Ne jamais s'en servir comme source.** Valeur historique seulement. |

Deux documents ont été archivés le 1er septembre 2026 parce qu'ils décrivaient une
architecture qui n'a jamais existé — NestJS, FastAPI, Meilisearch, un service IA Python :
`PLAN-janvier-2026.md` et `GETTING_STARTED-decembre-2025.md`. Chacun porte une bannière
d'avertissement en tête. Ils sont dans `docs/archive/` précisément pour qu'aucune IA ne
les lise comme une source.

**En cas de doute, c'est le code qui tranche** : `grep`, `find`, lis le fichier.

---

## Stack réelle (vérifiée)

| Couche | Réalité |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Node | >= 20 (testé en v22), `packageManager: pnpm@9.1.0` |
| Frontend | Next.js 14.2 (App Router), React 18, TypeScript 5.4, Tailwind 3.4 |
| Backend | **Express 4** (pas NestJS) — un seul fichier de 4 358 lignes, 92 routes |
| Base | PostgreSQL 16.15 (Homebrew) + Prisma 5.22 |
| Recherche | PostgreSQL `pg_trgm` (pas Meilisearch) |
| Auth | NextAuth v4 (Google, Email, Credentials) côté web uniquement |
| IA | Anthropic SDK (Claude Haiku). Le chemin OpenAI existe mais renvoie une 400 « pas encore implémenté » |
| Images | Cloudinary |
| Cartes | Mapbox GL JS |
| Paiement | Stripe (API `2024-12-18.acacia`) |
| UI | Radix, lucide-react, Tiptap, Recharts, framer-motion |

**Déclarés mais jamais utilisés :** Redis, Meilisearch, MinIO (dans `docker-compose.yml`), Mistral, Apple OAuth, PostHog, Resend.
**Absents malgré ce qu'on pourrait croire :** pgvector (le schéma ne déclare que `uuid_ossp` et `pg_trgm`), tout framework de test.

---

## Structure réelle

```
made-in-france/
├── apps/
│   ├── web/                      # Next.js — 45 pages, dont 42 en 'use client'
│   │   ├── middleware.ts         # ne protège RIEN, pose juste un header x-pathname
│   │   └── src/
│   │       ├── app/
│   │       │   ├── admin/        # back-office (10 pages)
│   │       │   ├── studio/       # espace marque B2B  ← LE canonique
│   │       │   ├── entreprises/  # landing marketing B2B UNIQUEMENT (plus d'inscription)
│   │       │   ├── marques/ produits/ secteurs/ regions/ carte/ recherche/
│   │       │   ├── admin/labels/ # fonctionnalité labels (absente de la copie locale de janvier)
│   │       │   └── api/auth/[...nextauth]/route.ts   # SEULE route API côté web
│   │       ├── components/       # header, footer, home/*, ui/*, ChatBot
│   │       ├── hooks/  lib/api.ts  styles/
│   └── api/
│       └── src/index.ts          # 4 358 lignes, 92 routes — LE monolithe
├── packages/
│   ├── database/prisma/schema.prisma   # 840 lignes, 33 modèles
│   └── shared/                   # types + constantes partagés
├── scripts/                      # imports, scrapers, enrichissement, stats
├── data/brands.xlsx              # 996 lignes (source des marques)
└── docker-compose.yml            # postgres, redis, meilisearch, minio, mailhog
```

---

## Commandes

```bash
# Base (préférer Docker à brew services)
docker compose up -d postgres

# Développement
pnpm dev                  # web (3000) + api (4000)
pnpm --filter @mif/web dev
pnpm --filter @mif/api dev

# Prisma — packages/database/.env est un lien vers le .env racine, sans quoi
# les commandes prisma ne trouvent pas DATABASE_URL
cd packages/database && pnpm exec prisma generate
npx prisma studio  --schema=./packages/database/prisma/schema.prisma
npx prisma migrate dev --schema=./packages/database/prisma/schema.prisma

# Vérifications
pnpm typecheck            # api, shared et database PASSENT.
                          # web échoue encore sur 22 erreurs — voir REBUILD.md phase 3
pnpm lint

# Données
npx tsx scripts/stats.ts             # compte réel marques / produits en base
npx tsx scripts/shopify-scraper.ts --all
npx tsx scripts/woocommerce-scraper.ts --all
npx tsx scripts/enrich-all-products.ts
```

### Environnement de la machine (remis en état le 1er septembre 2026)

| Outil | État |
|---|---|
| Node | **22.23.2** via `fnm`, épinglé par `.nvmrc`. La machine était passée en v26. |
| pnpm | **9.1.0** activé par `corepack` (conforme à `packageManager`). |
| PostgreSQL | **16.15 via Homebrew** (`postgresql@16`). Pas Docker : Docker n'est pas installé sur cette machine. |
| Docker | **absent.** `docker-compose.yml` est conservé mais inutilisable ici. |

**Démarrer PostgreSQL** — `LC_ALL` est obligatoire, sinon le serveur refuse de démarrer
(`postmaster became multithreaded during startup`) :

```bash
LC_ALL=C /opt/homebrew/opt/postgresql@16/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start
```

`brew services start postgresql@16` **ne fonctionne pas** : le Homebrew installé est trop
ancien pour cette formule (`undefined method 'stop_timeout'`). Un `brew update` corrigerait.

**Monter l'environnement complet** : `pnpm bootstrap` (install + generate + migrate + seed).
⚠️ **Ne pas écrire `pnpm setup`** : c'est une commande **interne** de pnpm qui masque
silencieusement le script du même nom — et qui écrit dans `~/.zshrc`.

**La base de données locale est repartie de zéro.** Les ~40 000 produits de janvier sont
perdus (aucune sauvegarde n'a jamais existé, cf. `REBUILD.md` T0.0). La base contient
aujourd'hui les données du seed : 13 régions, 9 secteurs, 11 catégories, 6 labels,
3 paliers d'abonnement, 4 marques et 2 produits. Le seul actif de données versionné est
`data/brands.xlsx` (996 marques), pas encore importé.

---

## Règles non négociables

### Sécurité

1. **Aucune route API ne part sans garde-fou d'authentification.** Toute route sous `/api/admin/*` exige un rôle admin vérifié **côté serveur**. Toute route sous `/api/v1/brands/:slug/*` en écriture exige la propriété de la marque, vérifiée en base.
2. **L'identité vient du token, jamais du client.** Un `userId`, un e-mail ou un rôle transmis dans la query string, le body ou un header applicatif n'est **pas** une preuve d'identité. Le motif `?userId=` doit disparaître complètement du projet.
3. **Jamais de `$queryRawUnsafe` avec de l'interpolation.** Requêtes paramétrées ou `Prisma.sql`. Si une requête dynamique est indispensable, les fragments variables doivent venir d'une liste blanche, jamais de l'entrée utilisateur.
4. **Aucune clé d'API dans un log, une réponse HTTP, une table ou une interface d'administration.** Les secrets vivent dans l'environnement du serveur, point. Un réglage IA stocke un nom de modèle et une température, pas une clé.
5. **Valider toute entrée avec Zod** avant de toucher la base. Zod est déjà dans les dépendances.
6. **Ne jamais committer de `.env*`** autre que `.env.example`.

### Structure

7. **Aucun nouveau fichier au-delà de ~300 lignes.** Le monolithe actuel est la cause n°1 des régressions ; ne pas le reproduire.
8. **Avant de créer une page, un composant ou une route, vérifier qu'un équivalent n'existe pas déjà.** Le projet contient déjà trois espaces B2B concurrents parce que cette règle n'existait pas. Un `grep` de 10 secondes évite un doublon d'une semaine.
9. **`/studio` est le seul espace marque.** `/espace-marque` a été supprimé le 1er septembre 2026 ; `/entreprises` est une landing marketing sans inscription. Ne pas recréer de troisième variante. ⚠️ `/connexion-pro` coexiste toujours avec `/studio/connexion` : doublon restant, à trancher en phase 3.
10. **Une seule source pour l'URL d'API** : `apps/web/src/lib/api.ts`, alimenté par `NEXT_PUBLIC_API_URL`. Zéro `http://localhost:4000` en dur (il y en a 57 dans 46 fichiers à nettoyer).

### Frontend

11. **Les pages publiques sont des Server Components par défaut.** `'use client'` est réservé aux feuilles réellement interactives (filtres, carte, lightbox, chatbot, formulaires, admin, studio).
12. **Chaque page publique exporte `generateMetadata`** : titre, description, Open Graph, canonique.
13. **Images via `next/image`**, avec les hôtes déclarés dans `next.config.js`.

### Méthode

14. **Une tâche = une branche = un commit qu'on peut annuler.** Jamais « répare tout » ou « refais l'application ».
15. **Le test arrive avec le code**, pas plus tard.
16. **Proposer un plan avant d'écrire du code** sur toute tâche non triviale, et attendre validation.
17. **Ne jamais lancer de migration destructive ni de `prisma db push`** sur la base de développement sans le dire explicitement avant. Les scripts `db:push` ont été retirés du projet (T2.5) : uniquement `prisma migrate`.

---

## Pièges connus (vérifiés dans le code)

| Piège | Détail |
|---|---|
| Ordre des routes Express | Les routes statiques doivent précéder les dynamiques (`/brands/search` avant `/brands/:slug`), sinon le slug avale tout |
| Tiptap en SSR | `immediatelyRender: false` dans `useEditor` |
| Webhook Stripe | Le corps brut doit rester non parsé — le contournement existe déjà `index.ts:23-29`, ne pas le casser |
| Dépôt public | `github.com/lgicquelw-tech/made-in-france` est **public**. Tout commit est immédiatement visible. Vérifier avant chaque push. |
| Import Stripe en double | `index.ts:11` **et** `index.ts:3944` — erreur de compilation TypeScript |
| Clearbit | Mort. Les logos passent par Google Favicons |
| Champs `snake_case` | Les requêtes SQL brutes utilisent les noms de colonnes (`description_short`, `image_url`, `brand_id`), pas les noms Prisma |
| `.env` | `apps/api/.env` et `apps/web/.env` sont des **liens symboliques** vers le `.env` racine. Les vrais fichiers sont : `.env` (racine, 34 clés) et `apps/web/.env.local` (9 clés NextAuth). Ils ne sont pas dupliqués. |
| Clé OpenAI | Le chemin OpenAI du chat renvoie une 400 volontaire (`index.ts:~2839`) |

---

## Protocole de fin de session

1. Mettre à jour la case correspondante dans `REBUILD.md` et ajouter une ligne au journal en fin de fichier.
2. Committer avec un message qui dit **quoi** et **pourquoi**.
3. Si une découverte contredit ce fichier, corriger ce fichier dans le même commit.
