# CLAUDE.md — Made in France

> Contexte permanent pour Claude Code. Lis ce fichier avant toute action.
> Le plan de travail détaillé est dans `REBUILD.md`.
> Dernière vérification du contenu de ce fichier contre le code : **30 août 2026**.

---

## Le projet en cinq lignes

Plateforme de découverte des marques et produits fabriqués en France : annuaire, fiches marque et produit, recherche, carte géolocalisée, espace B2B pour les marques.

Le projet a été développé sur 18 sessions entre décembre 2025 et janvier 2026, puis arrêté. Il est en **reconstruction contrôlée** : on garde les données, le design et le schéma métier, on refait le socle (backend, base, authentification, tests).

**Nous ne sommes pas en train d'ajouter des fonctionnalités.** Si une demande revient à ajouter une fonctionnalité avant la fin de la phase 7 de `REBUILD.md`, signale-le au lieu de l'implémenter.

---

## ⚠️ Documentation non fiable

- **`README.md` est faux.** Il décrit NestJS, FastAPI, Meilisearch et un service IA Python. Rien de tout ça n'existe. **Ne t'en sers jamais comme source.**
- **`PLAN.md` est faux.** Il date du 15 janvier 2026 et décrit une arborescence qui n'est pas celle du disque, affirme que le middleware protège `/admin` (il ne protège rien), que le chat frontend reste à faire (il est intégré), et que l'IA tourne sur GPT-4o-mini (le serveur appelle Claude).
- **La seule source de vérité, c'est le code.** En cas de doute : `grep`, `find`, lis le fichier.

---

## Stack réelle (vérifiée)

| Couche | Réalité |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Node | >= 20 (testé en v22), `packageManager: pnpm@9.1.0` |
| Frontend | Next.js 14.2 (App Router), React 18, TypeScript 5.4, Tailwind 3.4 |
| Backend | **Express 4** (pas NestJS) — un seul fichier |
| Base | PostgreSQL 16 + Prisma 5.22 |
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
│   ├── web/                      # Next.js — 46 pages, dont 45 en 'use client'
│   │   ├── middleware.ts         # ne protège RIEN, pose juste un header x-pathname
│   │   └── src/
│   │       ├── app/
│   │       │   ├── admin/        # back-office (10 pages)
│   │       │   ├── studio/       # espace marque B2B  ← LE canonique
│   │       │   ├── espace-marque/# DOUBLON à supprimer
│   │       │   ├── entreprises/  # landing B2B + inscription (3e variante)
│   │       │   ├── marques/ produits/ secteurs/ regions/ carte/ recherche/
│   │       │   └── api/auth/[...nextauth]/route.ts   # SEULE route API côté web
│   │       ├── components/       # header, footer, home/*, ui/*, ChatBot
│   │       ├── hooks/  lib/api.ts  styles/
│   └── api/
│       ├── src/index.ts          # 3 970 lignes, ~85 routes — LE monolithe
│       └── src/index.ts.backup   # 3 939 lignes mortes — À SUPPRIMER
├── packages/
│   ├── database/prisma/schema.prisma   # 840 lignes, 35 modèles
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

# Prisma — schéma à la racine de packages/database
cd packages/database && npx prisma generate
npx prisma studio  --schema=./packages/database/prisma/schema.prisma
npx prisma migrate dev --schema=./packages/database/prisma/schema.prisma

# Vérifications
pnpm typecheck            # ÉCHOUE actuellement — voir REBUILD.md phase 3
pnpm lint

# Données
npx tsx scripts/stats.ts             # compte réel marques / produits en base
npx tsx scripts/shopify-scraper.ts --all
npx tsx scripts/woocommerce-scraper.ts --all
npx tsx scripts/enrich-all-products.ts
```

`pnpm` fonctionne sur cette machine (`node_modules/.pnpm/` est peuplé, `pnpm-lock.yaml` fait 303 Ko). Si un outil te dit que pnpm est introuvable, c'est son environnement à lui, pas le projet.

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
9. **`/studio` est le seul espace marque.** Ne rien ajouter à `/espace-marque` (à supprimer) ni à `/entreprises` (landing marketing uniquement).
10. **Une seule source pour l'URL d'API** : `apps/web/src/lib/api.ts`, alimenté par `NEXT_PUBLIC_API_URL`. Zéro `http://localhost:4000` en dur (il y en a 57 dans 46 fichiers à nettoyer).

### Frontend

11. **Les pages publiques sont des Server Components par défaut.** `'use client'` est réservé aux feuilles réellement interactives (filtres, carte, lightbox, chatbot, formulaires, admin, studio).
12. **Chaque page publique exporte `generateMetadata`** : titre, description, Open Graph, canonique.
13. **Images via `next/image`**, avec les hôtes déclarés dans `next.config.js`.

### Méthode

14. **Une tâche = une branche = un commit qu'on peut annuler.** Jamais « répare tout » ou « refais l'application ».
15. **Le test arrive avec le code**, pas plus tard.
16. **Proposer un plan avant d'écrire du code** sur toute tâche non triviale, et attendre validation.
17. **Ne jamais lancer de migration destructive ni de `prisma db push`** sur la base de développement sans le dire explicitement avant.

---

## Pièges connus (vérifiés dans le code)

| Piège | Détail |
|---|---|
| Ordre des routes Express | Les routes statiques doivent précéder les dynamiques (`/brands/search` avant `/brands/:slug`), sinon le slug avale tout |
| Tiptap en SSR | `immediatelyRender: false` dans `useEditor` |
| Webhook Stripe | Le corps brut doit rester non parsé — le contournement existe déjà `index.ts:23-29`, ne pas le casser |
| Import Stripe en double | `index.ts:11` **et** `index.ts:3556` — erreur de compilation TypeScript |
| Clearbit | Mort. Les logos passent par Google Favicons |
| Champs `snake_case` | Les requêtes SQL brutes utilisent les noms de colonnes (`description_short`, `image_url`, `brand_id`), pas les noms Prisma |
| `.env` multiples | 5 fichiers avec les mêmes clés dupliquées — vérifier lequel est lu avant de débugger une variable manquante |
| Clé OpenAI | Le chemin OpenAI du chat renvoie une 400 volontaire (`index.ts:2817`) |

---

## Protocole de fin de session

1. Mettre à jour la case correspondante dans `REBUILD.md` et ajouter une ligne au journal en fin de fichier.
2. Committer avec un message qui dit **quoi** et **pourquoi**.
3. Si une découverte contredit ce fichier, corriger ce fichier dans le même commit.
