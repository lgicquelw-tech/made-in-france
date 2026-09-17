# CLAUDE.md — Made in France

> Contexte permanent pour Claude Code. Lis ce fichier avant toute action.
> Le plan de travail détaillé est dans `REBUILD.md`.
> Dernière vérification du contenu de ce fichier contre le code : **1er septembre 2026**.

---

## Le projet en cinq lignes

Plateforme de découverte des marques et produits fabriqués en France : **un fil de produits à l'accueil** (déterministe, personnalisé par des signaux gardés dans le navigateur — T8.9), annuaire, fiches marque et produit, recherche, carte géolocalisée, espace B2B pour les marques.

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
| Backend | **Next.js seul** — Route Handlers sous `apps/web/src/app/api/`. Express a été **supprimé le 17 septembre 2026** (option A, T0.1 → T3.8) : 92 routes migrées ou retirées, `apps/api` n'existe plus, il n'y a plus de port 4000 ni de `NEXT_PUBLIC_API_URL`. Tout appel se fait en **URL relative**. |
| Base | PostgreSQL 16.15 (Homebrew) + Prisma 5.22 |
| Recherche | PostgreSQL `pg_trgm` + **`unaccent`** (pas Meilisearch). Construction dans `lib/search.ts` et `lib/catalogue-public.ts`, servie par `/api/v1/search/all`, `/api/v1/brands`, `/api/v1/products` côté Next |
| Auth | NextAuth v4 (Google, Email, Credentials) côté web uniquement |
| IA | Anthropic SDK **0.125.0**. Chat : `claude-haiku-4-5` par défaut, réglable dans l'admin (Haiku 4.5, Sonnet 5, Opus 5). Enrichissement produit `pnpm data:enrich` (T5.7), qui **n'envoie rien sans `--appliquer`**. Plus aucun chemin OpenAI. |
| Images | Cloudinary |
| Cartes | Mapbox GL JS |
| Paiement | Stripe (API `2024-12-18.acacia`) |
| UI | Radix, lucide-react, Tiptap, Recharts, framer-motion |

**Déclarés mais jamais utilisés :** Redis, Meilisearch, MinIO (dans `docker-compose.yml`), Mistral, OpenAI, Apple OAuth, PostHog, Resend.
**Absents malgré ce qu'on pourrait croire :** pgvector (le schéma ne déclare que `uuid_ossp` et `pg_trgm`). **Tests : Vitest 5** depuis le 16 septembre 2026 (`pnpm test`, 159 tests : 80 dans `scripts/` (règles de données, normalisation d'import, langue des fiches), 79 dans `apps/web` (gardes, enveloppe de réponse, recherche, fil, audit, chat)). Playwright : 33 parcours (`pnpm test:e2e`) sur la base `_test`. CI GitHub Actions : `.github/workflows/ci.yml` (types, lint, tests, intégration, build, parcours).

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
│   │       │   ├── api/auth/[...nextauth]/route.ts
│   │       │   ├── api/admin/**                     # administration, derrière requireAdmin
│   │       │   ├── api/v1/**                        # lectures publiques, Studio (requireBrandOwner), /me/*, chat, webhook Stripe
│   │       │   └── api/v1/chat/route.ts             # le chat : lib/chat/{outils,conversation}.ts
│   │       ├── components/       # header, footer, home/*, ui/*, ChatBot
│   │       ├── hooks/  lib/api.ts  styles/
├── packages/
│   ├── database/prisma/schema.prisma   # 840 lignes, 33 modèles
├── scripts/                      # paquet @mif/scripts — DOIT rester dans pnpm-workspace.yaml
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
pnpm dev                  # web sur :3000 (il n'y a plus d'API separee)

# Prisma — packages/database/.env est un lien vers le .env racine, sans quoi
# les commandes prisma ne trouvent pas DATABASE_URL
cd packages/database && pnpm exec prisma generate
npx prisma studio  --schema=./packages/database/prisma/schema.prisma
npx prisma migrate dev --schema=./packages/database/prisma/schema.prisma

# Vérifications
pnpm typecheck            # PASSE sur les 6 tâches du monorepo. Le garder au vert.
pnpm build                # PASSE depuis le 10 septembre 2026 : 991 pages generees.
                          # Il ECHOUAIT depuis fevrier — le mode dev ne le signale pas.
                          # A lancer avant toute affirmation sur la mise en ligne.
pnpm lint                 # 6 paquets, 0 erreur attendue. Fonctionne depuis le 16 septembre 2026 (aucune config n'existait avant).

# Administration
pnpm admin:create         # cree ou promeut un administrateur (T3.15).
                          # POST /api/admin/setup est desactive : il creait un
                          # super_admin sans aucune authentification.

# Qualité des données (phase 5)
pnpm data:audit                      # lecture seule : combien de fiches sont publiables
pnpm data:audit --liens              # ... en interrogeant les liens sortants
pnpm data:links                      # desactive les liens durablement morts (jamais effaces)
pnpm data:links --simuler            # ... sans rien ecrire
pnpm data:publish                    # publie les produits complets, retire les incomplets (T5.8)
pnpm data:geocode                    # place les marques par leur commune, API Adresse nationale (T5.4)

# Données
npx tsx scripts/stats.ts             # compte réel marques / produits en base
npx tsx --env-file=.env scripts/shopify-scraper.ts --all        # detecte et importe toutes les boutiques Shopify
npx tsx --env-file=.env scripts/woocommerce-scraper.ts --all    # idem WooCommerce
npx tsx --env-file=.env scripts/shopify-scraper.ts <slug> <domaine>   # une seule marque
pnpm data:enrich                     # SIMULATION : ce qui serait envoye au modele, et le cout
pnpm data:enrich --appliquer         # appels factures — uniquement sur decision explicite
pnpm test                            # Vitest, tout le monorepo : 159 tests
pnpm --filter @mif/web test          # gardes d'autorisation, enveloppe de reponse
pnpm --filter @mif/scripts test      # regles de donnees : liens, bruit, fusion, publication, geocodage, enrichissement
pnpm test:integration                # 64 tests sur une VRAIE base, madeinfrance_test (creee par createdb -O mif_user madeinfrance_test)
pnpm test:e2e                        # 33 parcours Playwright, serveur Next lance sur madeinfrance_test
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

**Monter l'environnement complet** : `pnpm bootstrap` (install + generate + migrate + seed
+ import des 903 marques). Idempotent : relancé, il met à jour sans rien dupliquer.
⚠️ **Ne pas écrire `pnpm setup`** : c'est une commande **interne** de pnpm qui masque
silencieusement le script du même nom — et qui écrit dans `~/.zshrc`.

**La base de données locale est repartie de zéro.** Les ~40 000 produits de janvier sont
perdus (aucune sauvegarde n'a jamais existé, cf. `REBUILD.md` T0.0). Elle contient
aujourd'hui 13 régions, 9 secteurs, 11 catégories, 6 labels, 3 paliers d'abonnement,
**903 marques** (importées de `data/brands.xlsx` par `pnpm bootstrap`), **38 770 produits** pour 392 marques, collectés le 17 septembre 2026 par les scrapers (35 166 publiés par `pnpm data:publish`), et **aucun utilisateur** — lancer `pnpm admin:create` avant de tester l'administration. Une seconde base, `madeinfrance_test`, sert aux tests d'intégration et est vidée à chaque passage — 2 saisis à la main, 10 collectés le 11 septembre 2026 sur `www.airpurlabs.com` pour prouver l'idempotence du scraping.

⚠️ **Les liens `.env` sont ignorés par git** : `apps/api/.env`, `apps/web/.env` et tout
lien équivalent n'existent pas sur un clone neuf. C'est pourquoi **toutes les commandes
`db:*` tournent depuis la racine**, là où se trouve le `.env`. Ne pas réintroduire de
commande qui dépende d'un lien symbolique. À savoir aussi : `node --env-file` refuse les
chemins commençant par `../`.

---

## Règles non négociables

### Sécurité

0. **La propriété d'une marque ne s'accorde jamais automatiquement.** Une revendication crée une `BrandClaimRequest` en `PENDING` ; seul un examen humain la transforme en `BrandOwner`. Deux routes l'accordaient directement, sans authentification, jusqu'au 1er septembre 2026.
1. **Aucune route API ne part sans garde-fou d'authentification.** Toute route sous `/api/admin/*` exige un rôle admin vérifié **côté serveur**. Toute route sous `/api/v1/brands/:slug/*` en écriture exige la propriété de la marque, vérifiée en base.
2. **L'identité vient de la session, jamais du client.** Un `userId`, un e-mail ou un rôle transmis dans la query string, le corps, un en-tête **ou le chemin** n'est pas une preuve d'identité. Fait le 1er septembre 2026 : `?userId=`, `?email=` et `:userId` ont tous disparu. Les routes utilisateur sont sous **`/api/v1/me/*`**, une forme où l'on ne peut pas exprimer l'identité autrement.
3. **Jamais de `$queryRawUnsafe`.** Il n'y en a plus une seule depuis le 1er septembre 2026 : `Prisma.sql` et `Prisma.join`, où chaque `${...}` devient un paramètre lié. Seule exception admise : une clause `ORDER BY`, qui ne peut pas être un paramètre lié — elle doit alors venir d'une **liste blanche** en dur, jamais de l'entrée.
4. **Aucune clé d'API dans un log, une réponse HTTP, une table ou une interface d'administration.** Les secrets vivent dans l'environnement du serveur, point. Un réglage IA stocke un nom de modèle et une température, pas une clé.
5. **Valider toute entrée avec Zod** avant de toucher la base. Zod est déjà dans les dépendances.
6. **Ne jamais committer de `.env*`** autre que `.env.example`.

### Structure

7. **Aucun nouveau fichier au-delà de ~300 lignes.** Le monolithe actuel est la cause n°1 des régressions ; ne pas le reproduire.
8. **Avant de créer une page, un composant ou une route, vérifier qu'un équivalent n'existe pas déjà.** Le projet contient déjà trois espaces B2B concurrents parce que cette règle n'existait pas. Un `grep` de 10 secondes évite un doublon d'une semaine.
9. **`/studio` est le seul espace marque.** `/espace-marque` a été supprimé le 1er septembre 2026 ; `/entreprises` est une landing marketing sans inscription. Ne pas recréer de troisième variante. ⚠️ `/connexion-pro` coexiste toujours avec `/studio/connexion` : doublon restant, à trancher en phase 3.
10. **Tout appel d'API est relatif** (`/api/...`). Il n'y a plus d'URL d'API : `lib/api.ts`, `NEXT_PUBLIC_API_URL` et le port 4000 ont disparu avec Express le 17 septembre 2026. Ne pas les réintroduire.

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
| Tiptap en SSR | `immediatelyRender: false` dans `useEditor` |
| Webhook Stripe | `api/v1/stripe/webhook/route.ts` lit le corps **brut** (`request.text()`) avant `constructEvent` ; tout parsing préalable casse la signature. Un webhook non vérifiable échoue, jamais de repli. |
| Dépôt public | `github.com/lgicquelw-tech/made-in-france` est **public**. Tout commit est immédiatement visible. Vérifier avant chaque push. |
| Identité | Un seul modèle : `User`, avec `role` (`USER`/`ADMIN`/`SUPER_ADMIN`) et `isActive`. `AdminUser` n'existe plus. L'autorisation passe par `apps/web/src/lib/guards.ts`, qui **relit le rôle en base** — jamais depuis le jeton seul. |
| `useSearchParams()` | Impose une frontière `Suspense` dès qu'une page est prérendue, sinon `next build` échoue. Le mode développement ne dit rien. C'est ce qui rendait le projet non constructible. |
| Limitation de débit | En place depuis le 1er septembre 2026 : `express-rate-limit` côté API, `lib/rate-limit.ts` côté web. **Compteurs en mémoire du processus** — ils ne tiennent pas sur plusieurs instances. À reprendre au déploiement. Toute nouvelle route coûteuse (modèle payant, stockage, envoi d'e-mail) doit en poser un. |
| Middleware | **`apps/web/src/middleware.ts`**, pas `apps/web/middleware.ts` : avec un dossier `src/`, Next.js ne charge que le premier. L'ancien n'a jamais tourné. |
| Appels depuis le front | **URL relative** (`/api/...`), toujours. Il n'y a plus d'autre origine. |
| Données inventées | Cinq pages d'administration fabriquaient leurs chiffres quand l'appel échouait (39 835 produits, des entreprises réelles présentées comme clientes payantes…). Tout a été retiré. **Ne jamais réintroduire de données de repli** : un écran vide vaut mieux qu'un écran qui ment. |
| **Routes d'API figées au build** | Un Route Handler `GET` qui ne lit pas la requête est **prérendu au build** et sert à jamais l'état de la base de ce moment. La carte a servi `[]` en CI pour cette raison (17 septembre 2026). Chaque `route.ts` sous `app/api/` porte `export const dynamic = 'force-dynamic'` ; toute nouvelle route aussi. Et `route()` **relance** les signaux internes de Next (`DYNAMIC_SERVER_USAGE`, `NEXT_*`) au lieu de les convertir en 500. |
| `next build` et `next dev` partagent `.next/` | Lancer un build pendant que le serveur dev tourne écrase ses chunks : la page rend en HTML nu, les scripts répondent 500. Arrêter le dev, ou `rm -rf apps/web/.next` puis relancer. |
| Build contre une vraie base | `next build` prérend ~1 000 pages en parallèle, chaque worker avec son pool Prisma : un PostgreSQL local (100 connexions) sature. Borner : `DATABASE_URL="...&connection_limit=5"` pour le build. |
| **`signIn` sans erreur ne veut pas dire connecté** | NextAuth renvoie `{url: '/api/auth/signin?csrf=true'}` et **pas** d'`error` quand il rejette la requête pour jeton anti-CSRF — ce qui arrive si le formulaire est validé dans la seconde suivant l'ouverture de la page. Les quatre écrans redirigeaient alors vers le Studio sans session. Toute connexion par mot de passe passe par `lib/connexion.ts` (`connecter`), qui vérifie la session et réessaie une fois. |
| **Textes juridiques** | `content/editeur.ts` porte l'identité de l'éditeur : **tout est `null` tant que le propriétaire ne l'a pas renseigné**, et les pages l'affichent comme tel. Ne jamais y mettre une valeur plausible. `confidentialite/page.tsx` décrit les traitements **qui existent dans le code** : tout nouveau traitement (mesure d'audience, événements serveur, e-mail) modifie cette page dans le même commit. Chaque fiche produit et marque porte `<OrigineDonnees>` / `<OrigineMarque>`. |
| **Cache des fiches publiques** | `/marques/[slug]`, `/produits/[slug]` et les listes sont en `revalidate = 3600`. Toute route qui **écrit** une marque ou un produit appelle `rafraichirMarque` / `rafraichirProduit` (`lib/revalidation.ts`) après sa transaction, sinon la page publique ment pendant une heure. Le mode dev ne met rien en cache : seule la CI (`next start`) le vérifie. |
| **Piste d'audit** | Toute écriture sur une marque ou un produit passe par `prisma.$transaction` avec `journaliser(tx, …)` (`lib/audit.ts`) : champs modifiés seulement, jamais un secret. Une nouvelle route d'écriture **doit** la poser. Lecture : `GET /api/admin/audit`. |
| **Fil de l'accueil** | `lib/feed.ts` : score déterministe + pénalité de diversité par marque, départage par `md5(id || date)` — **jamais `RANDOM()`**, sinon le défilement infini remontre les mêmes produits. Les préférences (`s`, `m`, `q`) viennent de `lib/signaux.ts` (localStorage), servent à ordonner et **ne sont jamais stockées** côté serveur. |
| **Images de produits** | 172 hôtes distincts. `next/image` **lève et emporte la page** sur un hôte non déclaré. Toujours passer par `<ImageProduit>` (`components/image-produit.tsx`) : optimisé si l'hôte est dans `hotes-images.js` (la seule liste, lue aussi par `next.config.js`), `<img loading="lazy">` sinon. Ne jamais ouvrir `**`. |
| Prisma côté web | Toujours `import { prisma } from '@/lib/db'`. Ne jamais faire `new PrismaClient()` dans une route : une connexion par rechargement en dev, une par invocation à froid en serverless. |
| **Boutons produits du Studio** | `PUT /api/v1/products/:id` avec `status: 'INACTIVE'`, `isTrending`, `isNewProduct`, `salePrice` : aucun de ces champs n'existe, aucune route ne répond. Ces boutons n'ont jamais fonctionné. Décision de phase 8, pas à combler au passage. |
| `Brand` n'a ni `email` ni `phone` | Le formulaire Studio les propose pourtant. Ces champs ne sauvegardent rien. Écart consigné dans `REBUILD.md`, à trancher — pas à combler au passage. |
| Version d'API Stripe | Figée une seule fois dans `lib/stripe.ts` (`STRIPE_API_VERSION`). Ne pas la redéclarer ailleurs. |
| Clearbit | Mort. Les logos passent par Google Favicons |
| **Un 403 n'est pas un site mort** | C'est un pare-feu qui a reconnu un robot. Une boutique derrière Cloudflare répond 403 à l'audit et 200 à un humain. `data:links` a donc **trois** verdicts, pas deux : `vivant`, `mort`, `indetermine` — et ne désactive que les `mort`. Confondre les deux retire des marques vivantes de l'annuaire, silencieusement. |
| **Écriture d'un produit scrappé** | Un seul point : `scripts/catalogue/upsert.ts` → `enregistrerCollecte`. Les scrapers ne touchent **jamais** `prisma.product` directement. Clé stable `(brandId, externalSource, externalId)` ; le rescrape réécrit prix, images, lien, données brutes et `collectedAt`, et **jamais** descriptions, slug, statut, catégorie, matières, SEO. Un produit collecté naît en `DRAFT` : c'est l'audit (T5.8) qui publie. |
| **Traductions WooCommerce** | Dans l'API Store d'une boutique WPML / Polylang, **chaque traduction est un produit** : même fiche, un identifiant par langue, permalien préfixé (`/en/product/…`). Sans filtre, 1 824 fiches en anglais, allemand, espagnol et néerlandais sont entrées au catalogue le 17 septembre 2026 — et, arrivées avant, elles ont pris le slug des originales françaises, refusées ensuite. `catalogue/langue.ts` ne garde que les fiches sans préfixe ou en `fr` ; le slug se replie sur le permalien quand l'API n'en donne pas. Après une collecte, **lire les erreurs du journal** : une contrainte qui refuse dit quelque chose. |
| **L'import de marques ne touche pas au statut** | `brandData.status` vaut `PENDING_REVIEW` pour toute ligne du fichier. Le réécrire à la mise à jour remettait en attente chaque marque validée à chaque `pnpm bootstrap`. Le statut est une décision éditoriale, il ne vient pas du fichier. |
| **Recherche insensible aux accents** | `unaccent()` des **deux** côtés — colonne et saisie. 191 marques sur 903 ont un accent dans leur nom : désaccentuer la seule saisie laissait « creme » sans réponse devant « CRÈME BRÛLÉE ». Toute nouvelle clause de recherche passe par `correspondance()` de `catalogue-public.ts`. |
| **Double appel au montage** | Le motif `if (!hydrated) { setHydrated(true); return; }` avec `hydrated` dans les dépendances relance l'effet et refait l'appel que le serveur venait de rendre. Corrigé dans cinq composants ; utiliser une référence sur la dernière requête résolue, jamais ce drapeau. Variante Studio : un effet sur `[slug, status]` charge à `loading` **et** à `authenticated`, et le second chargement écrase la saisie en cours — attendre que la session soit connue. |
| Géocodage | Par **commune**, via `api-adresse.data.gouv.fr` ; précision = centre de la commune. Les homonymes (cinq « Saint-Denis ») sont départagés par la région de la marque ; sans correspondance on ne devine pas. |
| Désactivation d'un lien | Ne détruit **jamais** l'URL : on pose `websiteDeadAt` / `buyUrlDeadAt` et l'affichage cesse. Il faut 3 échecs consécutifs **et** un premier échec vieux de 72 h — sans la seconde condition, relancer la commande trois fois pendant une panne d'hébergeur viderait l'annuaire. |
| **Taxonomie des secteurs** | Une seule liste fait foi, partagée par quatre endroits : `data/brands.xlsx`, `SECTOR_MAPPING` de `scripts/import/import-brands.ts`, le seed, et le front (`app/secteurs/page.tsx` + `sitemap.ts`). Les 9 slugs : `mode-accessoires`, `maison-jardin`, `gastronomie`, `cosmetique`, `enfance`, `loisirs-sport`, `animaux`, `sante-nutrition`, `high-tech`. **Modifier l'un sans les autres laisse des centaines de marques sans secteur, sans la moindre erreur.** C'est arrivé : 687 marques sur 903. |
| Noms de marque numériques | `909`, `1083`, `1336` sont de vraies marques. XLSX lit leur nom comme un **nombre** : toute validation en `typeof === 'string'` les rejette silencieusement. |
| `scripts/` | Est un paquet du workspace (`@mif/scripts`) avec ses propres dépendances. Il doit rester listé dans `pnpm-workspace.yaml`, sinon `pnpm install` l'ignore et aucun script ne fonctionne. |
| Champs `snake_case` | Les requêtes SQL brutes utilisent les noms de colonnes (`description_short`, `image_url`, `brand_id`), pas les noms Prisma |
| `.env` | `apps/api/.env` et `apps/web/.env` sont des **liens symboliques** vers le `.env` racine. Les vrais fichiers sont : `.env` (racine, 34 clés) et `apps/web/.env.local` (9 clés NextAuth). Ils ne sont pas dupliqués. |
| Chat | `lib/chat/outils.ts` + `conversation.ts`. Modèle et prompt viennent de `site_settings` (`ai_settings`), la **clé** uniquement de `ANTHROPIC_API_KEY`. Tous les `tool_use` d'un tour reçoivent leur `tool_result` dans **un seul** message — l'ancienne boucle n'en traitait qu'un, et l'API refusait le tour suivant. La température n'est envoyée qu'à Haiku (400 sur Sonnet 5 / Opus 5). |

---

## Protocole de travail

### À chaque étape terminée — pas à la fin de la session

**Écrire une entrée dans `docs/JOURNAL.md`** : le but, ce qui a été fait, la commande de
vérification **et son résultat chiffré**, le commit. Une étape qui échoue y reste avec son
échec : c'est précisément ce qui manquait au projet de janvier 2026, où seul le succès
était consigné.

L'entrée est écrite **quand l'étape est faite et vérifiée**, jamais par anticipation.

### À la fin de la session

1. Cocher la case correspondante dans `REBUILD.md` et ajouter **une ligne de synthèse** au
   journal en fin de ce fichier — la synthèse, pas le détail : le détail est dans
   `docs/JOURNAL.md`.
2. Committer avec un message qui dit **quoi** et **pourquoi**.
3. Si une découverte contredit ce fichier, corriger ce fichier dans le même commit.

### Qui écrit quoi

| Fichier | Rôle | Granularité |
|---|---|---|
| `REBUILD.md` | le plan : cases, décisions ouvertes, synthèse | une ligne par session |
| `docs/JOURNAL.md` | le récit : chaque étape et sa vérification | une entrée par étape |
| `git log` | la preuve : le diff exact | un commit par tâche |
