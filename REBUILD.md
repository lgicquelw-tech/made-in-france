# Made in France — Plan de reconstruction

> Plan de travail opérationnel. Audit du 30 août 2026, recoupé avec un second audit indépendant.
> Les garde-fous permanents sont dans `CLAUDE.md`.
> **Chaque affirmation de ce document a été vérifiée dans le code**, avec fichier et ligne.

---

## Comment utiliser ce fichier

- Une case `[ ]` = une tâche assez petite pour tenir dans une session Claude Code et un commit annulable.
- Les phases sont **séquentielles**. Chacune installe le filet dont la suivante a besoin. Sauter la 3 pour faire la 8 reproduit exactement l'état de janvier 2026.
- Chaque phase a un **critère de sortie** vérifiable par une commande, pas par une impression.
- En fin de session : cocher, ajouter une ligne au journal en bas, committer.

**Ordre imposé, résumé :** sauvegarder → décider le périmètre → base reproductible → backend → front public → données → tests → mise en ligne → seulement là, fonctionnalités.

---

## 1. État vérifié du dépôt

### Volumétrie

> ⚠️ **Corrigé le 1er septembre 2026.** L'audit d'août portait sur une copie locale
> périmée. `origin/main` (`7878ad4`, 17 février 2026) contenait 11 routes et 9 fichiers
> de plus. Les chiffres ci-dessous sont ceux de la vraie base de code.

| Mesure | Valeur (audit août, copie périmée) | Valeur réelle (`origin/main`) |
|---|---|---|
| `apps/api/src/index.ts` | 3 970 lignes, ~85 routes | **4 385 lignes, 92 routes** |
| `apps/web` — pages | 46 dont 45 en `'use client'` | **49 dont 46 en `'use client'`** |
| `export metadata` / `generateMetadata` | 1 | **1** |
| Balises `<img>` brutes | 40 | **69** (contre 2 `next/image`) |
| `localhost:4000` en dur | 57 dans 46 fichiers | **60 dans 49 fichiers** |
| `schema.prisma` | 840 lignes, 35 modèles | **840 lignes, 33 modèles** |
| `data/brands.xlsx` | 996 lignes | 996 lignes |
| Fichiers de test | 0 | **0** |
| Commits git | 1 (`5ba9c53`) | **2** (`5ba9c53`, `7878ad4`) |

`apps/api/src/index.ts.backup` n'existe **pas** sur `origin/main` — il n'existait que dans
la copie locale. T1.4 n'a plus lieu d'être pour ce fichier.

### Chiffres à vérifier avant d'arbitrer

`PLAN.md` annonce 902 marques et 39 835 produits actifs. Le dépôt contient bien le fichier source des marques, mais **les produits n'existent que dans le PostgreSQL local** — ils ne sont dans aucun fichier versionné.

`enrichment-test-results.json` contient de vrais UUID Postgres de produits avec leurs marques, et le scraping a bien été mené à son terme fin 2025 / début 2026 : **environ 40 000 produits ont réellement été collectes, en quelques heures de scraping**. La question n'est donc pas de savoir s'ils ont existé, mais s'ils sont **encore** dans le PostgreSQL local sept mois plus tard.

Bonne nouvelle qui change le niveau de risque : les scrapers sont rejouables. Si le catalogue a disparu, `shopify-scraper.ts --all` et `woocommerce-scraper.ts --all` le reconstruisent en quelques heures. **Ce qui ne se régénère pas par un scraping**, en revanche : l'enrichissement IA (tags, matériaux, bénéfices, cible, gamme de prix — payé en appels de modèle), les 872 géocodages, les logos, et tout le travail éditorial fait dans l'admin (`aiGeneratedContent`, sections, tags marque). C'est **ça** le vrai actif irremplaçable, pas les lignes produit brutes.

Avant de dimensionner quoi que ce soit :

```bash
docker compose up -d postgres     # ou brew services start postgresql@16
npx tsx scripts/stats.ts
```

- [x] **T0.0 — Chiffres réels (1er septembre 2026) : la base n'existe plus.**
  - Marques : **0** — PostgreSQL n'est pas installé sur la machine
  - Marques avec produits : **0**
  - Produits actifs : **0**

Vérifications faites : `docker` absent (pas de Docker.app ni d'OrbStack), PostgreSQL absent
(ni Homebrew, ni Postgres.app, `psql`/`pg_dump` introuvables), aucun répertoire de données
(`PG_VERSION` introuvable dans tout `~`), port 5432 fermé, aucun processus ni service,
aucun dump nulle part.

**Les ~40 000 produits n'existaient que dans ce Postgres local et n'ont jamais été
sauvegardés.** Recherche exhaustive faite le 1er septembre 2026, résultat négatif :

| Piste | Résultat |
|---|---|
| Time Machine | **Aucune destination configurée** — aucune sauvegarde n'a jamais tourné |
| Instantanés locaux APFS | aucun |
| Disques externes montés | aucun (seul un installeur monté en lecture seule) |
| `*.dump` / `*.sql` / `*.pgdump` dans tout `~` | aucun, hors migrations du projet et caches système |
| Autre copie du projet sur le disque | une seule, sans rapport (page de portfolio) |
| Dossier `madeinfrance-hostinger` (cité dans `.gitignore`) | introuvable |

**Conclusion : sur cette machine, le catalogue produit est perdu.** Il ne peut subsister
que sur une autre machine ou dans une sauvegarde distante. À confirmer par toi.

Conséquence si la copie n'existe pas : le seul actif de données versionné est
`data/brands.xlsx` (996 marques). La v1 devient un annuaire de marques, le catalogue
produit se reconstruit par les scrapers en phase 5, et les phases 5 et 6 changent d'échelle.

---

## 2. Les 15 constats vérifiés

### Critiques — bloquent toute mise en ligne

| # | Constat | Preuve |
|---|---|---|
| 1 | **L'API n'a aucune authentification.** ~85 routes ouvertes, dont `DELETE /api/admin/brands/:id`, les uploads et Stripe. Zéro middleware. | `apps/api/src/index.ts` — 0 occurrence de `requireAuth`/`verifyToken`/`Bearer` |
| 2 | **L'admin est « protégé » par le navigateur.** Une ligne dans la console suffit. | `apps/web/src/app/admin/layout.tsx:47` → `localStorage.getItem('admin')` |
| 3 | **L'identité circule en query string.** N'importe qui passe n'importe quel `userId` et édite n'importe quelle marque. | `index.ts:2972` (ownership), `:3012` et `:3104` (dashboard GET/PUT) |
| 4 | **Injection SQL, chemin public.** Les mots-clés du chat sont concaténés dans la requête. | `index.ts:2643` → `p.name ILIKE '%${k}%'` puis `:2662` `$queryRawUnsafe(query)` ; même motif `:2723` |
| 5 | **La clé secrète Stripe est journalisée en clair.** | `index.ts:3569` → `console.log(…, 'value:', process.env.STRIPE_SECRET_KEY)` |
| 6 | **Une route publique distribue les clés IA.** `GET` renvoie `anthropicApiKey` et `openaiApiKey` en clair, sans auth. Le `PUT` écrit `process.env` depuis `req.body`. | `index.ts:3910` (GET), `:3937` (PUT) |
| 7 | **La création du premier `super_admin` est ouverte.** Seul garde-fou : « un admin existe déjà ». | `index.ts:2366` |

### Structurels — bloquent le travail assisté par IA

| # | Constat | Preuve |
|---|---|---|
| 8 | **Le site est invisible pour Google.** 45 pages sur 46 en `'use client'`, 1 seul `export metadata`, 0 `next/image`, 40 `<img>` bruts. Pour un annuaire, c'est le canal d'acquisition entier. | `find`/`grep` sur `apps/web/src/app` |
| 9 | **Trois espaces B2B concurrents.** Une IA modifiera le mauvais une fois sur deux. | `/entreprises`, `/espace-marque/[slug]`, `/studio/marque/[slug]` |
| 10 | **Un monolithe de 3 970 lignes** mêlant catalogue, admin, paiement, IA, uploads et auth. | `apps/api/src/index.ts` (+ `.backup` de 3 939 lignes) |
| 11 | **57 `http://localhost:4000` en dur dans 46 fichiers.** Seuls 3 fichiers utilisent `NEXT_PUBLIC_API_URL`. | `grep -rn "localhost:4000" apps/web/src` |
| 12 | **Schéma et migrations désynchronisés.** Migration unique du 5 janvier, `schema.prisma` modifié le 14 → la base a été mise à jour au `db push`. | `migrations/20260105230946_init/` vs date de `schema.prisma` |
| 13 | **Zéro test, zéro CI, zéro config de déploiement.** `turbo.json` déclare `test` et `test:e2e` — qui ne pointent sur rien. | pas de `*.test.*`, pas de `.github/`, pas de `vercel.json` |
| 14 | **Un seul commit, et `.env.local` non ignoré.** `.gitignore` ne couvre que `.env`, donc `apps/web/.env.local` (contenant `NEXTAUTH_SECRET` et le secret OAuth Google) est prêt à être committé. | `git log`, `git status` |
| 15 | **Les statistiques vendues aux marques sont inventées.** L'API renvoie vues, clics et taux de conversion en `Math.random()`, et la page Studio génère en plus ses propres courbes aléatoires. | `index.ts:3063-3067` ; `studio/marque/[slug]/statistiques/page.tsx:68-69` |

### Erreurs de compilation connues

- Import `Stripe` en double : `index.ts:11` **et** `index.ts:3556`.
- Client Prisma non généré / non résolu selon les packages.
- `@prisma/client` et `@mif/database` absents des dépendances de `apps/web` alors que `route.ts` de NextAuth les importe (ça ne marche que par remontée de `node_modules`).
- Types de session NextAuth incomplets : `session.user.id` est assigné sans déclaration de module.
- 38 `: any`, 35 `console.log`.

---

## 3. Périmètre de la v1

### Dans la v1

1. Recherche et découverte de marques françaises
2. Fiche marque : localisation, secteur, site, labels
3. Catalogue produit **limité aux produits dont les données sont fiables**
4. Carte et filtres région / secteur
5. Comptes utilisateurs et favoris
6. Espace marque minimal : revendiquer sa fiche, puis l'éditer **après validation manuelle**

### Explicitement reporté après la v1

| Reporté | Pourquoi |
|---|---|
| Paiements Stripe | L'offre Premium repose sur des analytics fabriquées (constat 15). On ne facture pas un graphique aléatoire. |
| Analytics B2B | À reconstruire sur de vrais événements avant toute promesse commerciale. |
| Campagnes sponsorisées | Dépend des analytics. |
| Chat IA conversationnel | Fonctionne, mais le catalogue ne doit pas en dépendre. Recommandation déterministe d'abord. |
| Recherche sémantique / embeddings | **pgvector n'est pas installé** (le schéma ne déclare que `uuid_ossp` et `pg_trgm`). À évaluer seulement après audit de la qualité des données produit. |
| Synchronisation automatique Shopify/WooCommerce | Import manuel maîtrisé d'abord. |

Cela évite de reconstruire simultanément un annuaire, un SaaS B2B, une plateforme de paiement et un assistant IA — ce qui est précisément ce qui a fait échouer la première tentative.

---

## 4. Décision à trancher avant la phase 3

Deux applications parlent aujourd'hui à la même base : Next.js et Express. La phase 3 est le seul moment raisonnable pour décider si cette séparation reste.

**Option A — tout dans Next.js.** Les routes deviennent des Route Handlers, `apps/api` disparaît, les scrapers restent des scripts.
*Pour :* une seule session d'auth, plus de CORS ni de token à faire traverser, un seul déploiement, un seul jeu de variables, et les Server Components lisent la base directement (la phase 4 devient beaucoup plus simple).
*Contre :* migration plus lourde au départ, et il faut un pooler de connexions (Neon, Supabase ou pgbouncer) car le serverless multiplie les connexions Prisma.

**Option B — garder Express, sécurisé.** Découpage en modules, garde-fous d'auth, validation, vérification du JWT NextAuth côté API.
*Pour :* chemin plus court, moins de risque immédiat, adapté si des traitements longs doivent tourner dans l'API.
*Contre :* deux déploiements, deux jeux de variables, l'auth à faire traverser une frontière d'origine, et le risque que les deux couches redivergent.

- [x] **T0.1 — Tranché le 1er septembre 2026 : option A.**

> **Décision : option A — tout dans Next.js.** Le canal d'acquisition du projet est Google,
> et il est maintenu par une seule personne : une seule session d'auth, un seul déploiement,
> un seul jeu de variables, et des Server Components qui lisent la base directement valent
> plus que le chemin plus court de l'option B. Les scrapers restent des scripts autonomes,
> ils n'ont pas besoin de tourner dans l'API. Prérequis assumé : un pooler de connexions
> (Neon ou Supabase) puisque le serverless multiplie les connexions Prisma.

Critère simple : si l'objectif est un site public rapide, bien référencé, maintenable seul → **A**. Si les scrapers et l'enrichissement doivent tourner *dans* l'API → **B**.

---

## Phase 0 — Figer et sécuriser · ½ journée

> Rien d'autre ne commence avant. Aucune de ces tâches ne dépend d'une décision d'architecture.

- [~] **T0.2** — *Sans objet pour l'instant : il n'y a plus de base à sauvegarder (T0.0).*
  Fait à la place le 1er septembre 2026 : sauvegarde de l'arbre de travail local complet
  (`~/backups/mif-arbre-local-20260901-0908.tar.gz`, 727 Ko, 283 fichiers, `.env` inclus).
  ⚠️ **Elle est sur la même machine — à copier hors machine.**
  Le `pg_dump` ci-dessous reste à faire si une copie de la base est retrouvée :
  ~~`pg_dump` de la base complète~~, horodaté, copié **hors de la machine** (disque externe ou stockage distant). Les produits bruts se rescrapent en quelques heures ; l'enrichissement IA, les géocodages, les logos et le travail éditorial fait dans l'admin, non. C'est eux que ce dump protège.
  ```bash
  pg_dump "postgresql://mif_user:***@localhost:5432/madeinfrance" \
    -Fc -f ~/backups/mif-$(date +%Y%m%d).dump
  ```
- [x] **T0.3** — Corriger `.gitignore` : remplacer `.env` par `.env*` + `!.env.example`. Vérifier avec `git status` que plus aucun `.env.local` n'apparaît.
- [x] **T0.4** — Supprimer `index.ts:3984` (la ligne qui journalise la clé Stripe).
- [x] **T0.5** — Neutraliser `GET /api/admin/ai/settings` (retirer `anthropicApiKey` et `openaiApiKey` de la réponse) et le `PUT` qui écrit `process.env` depuis le body.
  Fait via un helper `sanitizeAiSettings` qui filtre tout champ dont le nom contient
  `apikey`/`secret`/`token`/`password`, appliqué en lecture **et** en écriture, plus
  suppression des trois champs de saisie de clés dans `apps/web/src/app/admin/ia/page.tsx`.
- [x] **T0.6** — Neutraliser `POST /api/admin/setup` (le commenter jusqu'à ce qu'il soit protégé).
- [ ] **T0.7** — ⚠️ **À TA CHARGE** — **Régénérer tous les secrets exposés** : Stripe, Anthropic, OpenAI, `NEXTAUTH_SECRET`, identifiants Google OAuth.
- [x] **T0.8** — Fait. Branche `archive/janvier-2026` (`c5eec46`) poussée : elle fige la copie locale périmée. Le vrai point de retour reste `origin/main` (`7878ad4`).
- [x] **T0.9** — `main` réaligné sur `origin/main` (`7878ad4`), qui est la base de code complète — pas sur l'archive locale.

**Critère de sortie**
```bash
git log --oneline | wc -l          # 3 ✅
git status --short | grep '\.env'  # aucune sortie ✅
grep -rn "STRIPE_SECRET_KEY" apps/api/src/index.ts | grep console  # aucune sortie ✅
ls ~/backups/mif-*                 # sauvegarde de l'arbre présente ✅ (pas de dump : plus de base)
```
Reste ouvert : **T0.7** (régénération des secrets, à ta charge) et la copie hors machine
de la sauvegarde.

---

## Phase 1 — Périmètre et doublons · 1 jour

- [x] **T1.1** — `docs/SPEC-V1.md` (49 lignes). Six fonctionnalités qui partent, sept reportées, trois conditions non négociables avant mise en ligne. Tient compte de la perte du catalogue : la v1 se construit sur les 996 marques de `data/brands.xlsx`, pas sur les produits.
- [x] **T1.2** — Supprimé (2 fichiers, 1 319 lignes). Les 2 redirections de `connexion-pro` pointent désormais vers `/studio/marque/[slug]`.
- [x] **T1.3** — `entreprises/inscription` (446 lignes) et `entreprises/revendiquer` (263 lignes) supprimés, 7 liens redirigés vers `/studio`.
  ⚠️ **Une perte assumée :** la landing liait `inscription?plan=premium` et `?plan=sponsored`, or `/studio/inscription` ne lit que `?claim=`. Plutôt que de perdre le paramètre en silence ou d'ajouter une fonctionnalité avant l'heure, ces liens pointent l'inscription simple ; le choix du palier se fera dans `/studio/marque/[slug]/abonnement`. À revoir en phase 8 avec le paiement.
- [x] **T1.4** — Fait : `tsconfig.tsbuildinfo` et les 5 scripts ponctuels (604 lignes). `index.ts.backup` n'existait pas sur `origin/main` — il n'était que dans la copie locale périmée.
- [x] **T1.5** — `CLAUDE.md` est à la racine et a été recoupé avec le code trois fois dans la session.
- [x] **T1.6** — `README.md` réécrit intégralement depuis le code : stack réelle, démarrage effectivement testé (y compris le piège `LC_ALL` et le piège `pnpm setup`), et une section « Limites connues » qui dit franchement que l'API n'a aucune authentification.
- [x] **T1.7** — `PLAN.md` archivé en `docs/archive/PLAN-janvier-2026.md`, avec bannière d'avertissement.
  **Découvert au passage :** `docs/GETTING_STARTED.md` racontait la même fiction (NestJS, FastAPI, Meilisearch, MinIO) — c'était une **troisième** source fausse, non listée dans ce plan. Archivé de même en `docs/archive/GETTING_STARTED-decembre-2025.md`.

**Critère de sortie** — atteint :

```bash
grep -rn "espace-marque" apps/          # aucune sortie ✅
grep -rn "entreprises/inscription" apps/ # aucune sortie ✅
```

Effet mesuré : les erreurs de `pnpm typecheck` sur `@mif/web` passent de **22 à 12**.

⚠️ **Un doublon subsiste, hors périmètre de cette phase :** `/connexion-pro` coexiste avec
`/studio/connexion`. Non traité ici parce que ce plan ne le listait pas et que les deux
pages ont des comportements différents. À trancher en phase 3, avec l'authentification.

---

## Phase 2 — Base reproductible · 1 jour

- [x] **T2.1** — `.nvmrc` = `22`. Node 22.23.2 installé via `fnm`, pnpm 9.1.0 activé par `corepack`.
- [x] **T2.2** — Fait (les 6 `node_modules` supprimés : ils contenaient des modules natifs compilés pour Node 26). Installation en 7,9 s.
- [x] **T2.3** — Ajoutés (`@prisma/client@^5.22.0`, `@mif/database@workspace:*`). Supprime l'erreur `Cannot find module '@prisma/client'` du typecheck.
- [x] **T2.4** — Migration `20260901000000_init` régénérée depuis `schema.prisma`, appliquée sur une base neuve et vide. L'ancienne `20260105230946_init` avait bien divergé : il lui manquait **`brand_owners`, `brand_claim_requests` et `brand_images`** (30 tables contre 33), ajoutées à l'époque par un `db push`.
- [x] **T2.5** — Scripts `db:push` supprimés de `package.json` (racine) et de `packages/database/package.json`. Plus aucune occurrence dans le dépôt.
- [x] **T2.6** — ⚠️ **Modifié : Homebrew au lieu de Docker.** Docker n'est pas installé sur la machine et l'installer représentait ~1 Go pour un seul service. PostgreSQL 16.15 tourne via `postgresql@16` (Homebrew). `redis`, `meilisearch` et `minio` ont malgré tout été retirés du compose, qui reste utilisable sur une machine équipée de Docker (il ne garde que `postgres` et `mailhog`).
  **Piège macOS :** sans `LC_ALL` valide, le serveur refuse de démarrer (`postmaster became multithreaded during startup`).
- [x] **T2.7** — Il n'y avait pas 5 fichiers : `apps/api/.env` et `apps/web/.env` sont des **liens symboliques** vers le `.env` racine. Un troisième lien a été ajouté pour `packages/database/.env` (Prisma ne remonte pas jusqu'à la racine). Vrais fichiers : `.env` (34 clés) et `apps/web/.env.local` (9 clés NextAuth). `.env.example` complété : les 7 clés manquantes (Cloudinary, SMTP) ajoutées, toutes valeurs vides.
- [~] **T2.8** — Le seed existant **plantait** : il déclarait les paliers `STARTER` et `STANDARD`, disparus du schéma (qui a `FREE`/`PREMIUM`/`ROYALE`). Réécrit sur les trois vrais paliers, aux tarifs réellement affichés par le Studio (0 € / 29 € / 99 €), avec `update` rempli au lieu de `update: {}` — relancer le seed corrige désormais une ligne qui a dérivé au lieu de la laisser en l'état (il a d'ailleurs corrigé un Premium à 199 € hérité de l'ancienne version).
  **Reste à faire :** il ne produit que 13 régions, 9 secteurs, 11 catégories, 6 labels, 3 paliers, **4 marques et 2 produits**. L'objectif de ~50 marques et ~2 000 produits passe par l'import de `data/brands.xlsx` (996 marques) et les scrapers — à traiter avec la phase 5.
- [x] **T2.9** — `slug`, `status`, `brand_id`, `sector_id`, `region_id` existaient déjà via le schéma. Seuls manquaient les index GIN trigram : ajoutés dans `schema.prisma` (`@@index([name(ops: raw("gin_trgm_ops"))], type: Gin)`) et migrés (`20260901072814_index_trigram_recherche`). Vérifié : le planificateur les utilise (`Bitmap Index Scan on brands_name_idx`).
- [x] **T2.10** — ⚠️ **La commande s'appelle `pnpm bootstrap`, pas `pnpm setup`** : `setup` est une commande **interne** de pnpm (elle configure `PNPM_HOME` dans le shell) et masque silencieusement tout script du même nom. Enchaîne `install --frozen-lockfile` → `db:generate` → `db:migrate:prod` → `db:seed`. Testée deux fois, rejouable.

**Critère de sortie** — atteint le 1er septembre 2026, à une réserve près :

```bash
pnpm bootstrap   # install + generate + migrate + seed — testé, rejouable
pnpm dev         # web 3000 + api 4000, prêts en 2,5 s
curl "http://localhost:4000/api/v1/brands?limit=3"   # renvoie Armor Lux & co ✅
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/marques/armor-lux  # 200 ✅
```

⚠️ **Réserve : le démarrage de PostgreSQL n'est pas encore dans `pnpm bootstrap`.** Il faut
le lancer à la main, avec `LC_ALL` positionné :

```bash
LC_ALL=C /opt/homebrew/opt/postgresql@16/bin/pg_ctl \
  -D /opt/homebrew/var/postgresql@16 -l /opt/homebrew/var/postgresql@16/server.log start
```

`brew services` ne fonctionne pas ici : le Homebrew installé est trop ancien pour la
formule `postgresql@16` (`undefined method 'stop_timeout'`). Un `brew update` devrait le
corriger — non fait pour ne pas mélanger une maintenance Homebrew avec cette session.

---

## Phase 3 — Reconstruire le backend · 4 à 6 jours

> La plus grosse phase, et le prérequis de tout le reste. **Un groupe de routes = une branche = un commit.**
> Si l'option A a été retenue en T0.1, « module » signifie « groupe de Route Handlers Next.js ».

### 3a — Découpage

- [ ] **T3.1** — Créer la structure de modules : `catalogue-marques`, `catalogue-produits`, `recherche`, `comptes-sessions`, `administration`, `espace-marque`, `import-synchronisation`, `medias`, `paiements`, `ia`.
- [ ] **T3.2** — Migrer les routes marques. Routes fines, logique en services, aucun fichier > 300 lignes.
- [ ] **T3.3** — Migrer les routes produits.
- [ ] **T3.4** — Migrer la recherche.
- [ ] **T3.5** — Migrer l'administration.
- [ ] **T3.6** — Migrer l'espace marque.
- [ ] **T3.7** — Migrer médias, paiements, IA.
- [ ] **T3.8** — Supprimer l'ancien `index.ts` une fois toutes les routes migrées et vérifiées.

### 3b — Authentification et droits

- [ ] **T3.9** — Une seule authentification cohérente pour utilisateurs, propriétaires de marque et administrateurs. Décider du sort du modèle `AdminUser`, aujourd'hui séparé de `User` : le fusionner dans `User` avec un rôle est plus simple à sécuriser.
- [ ] **T3.10** — Rôles explicites en base + vérification serveur.
- [ ] **T3.11** — Middlewares `requireUser`, `requireAdmin`, `requireBrandOwner(slug)`.
- [ ] **T3.12** — **Supprimer tout `?userId=`.** L'identité vient du token.
  ```bash
  grep -rn "userId" apps/api/src | grep -i "query\|req.query"   # doit devenir vide
  ```
- [ ] **T3.13** — Vérifier l'appartenance à la marque pour **chaque** action B2B en écriture.
- [ ] **T3.14** — Piste d'audit : qui a modifié quoi, quand, sur les fiches marque.
- [ ] **T3.15** — Protéger `POST /api/admin/setup` ou le remplacer par une commande CLI.

### 3c — Robustesse

- [ ] **T3.16** — Schéma Zod en entrée de chaque endpoint, réponse typée.
- [ ] **T3.17** — Éliminer les `$queryRawUnsafe` à interpolation (`:1884`, `:1934`, `:2662`, `:2723`).
  ```bash
  grep -rn "queryRawUnsafe" apps/api/src   # zéro, ou uniquement avec des paramètres liés
  ```
- [ ] **T3.18** — Corriger l'import Stripe en double et figer la version d'API dans un seul module.
- [ ] **T3.19** — **Aucun secret en base ni en réponse HTTP.** Les réglages IA ne stockent qu'un nom de modèle et une température.
- [ ] **T3.20** — Uploads : type MIME réel, taille, propriété de la marque, quota par compte — tout vérifié serveur.
- [ ] **T3.21** — Limitation de débit sur `/chat`, `/search`, `/upload`.
- [ ] **T3.22** — Gestionnaire d'erreurs centralisé, logs structurés (pino), suppression des 35 `console.log`.
- [ ] **T3.23** — Centraliser l'accès aux données côté web dans `lib/api.ts` et éliminer les 57 `localhost:4000`.
  ```bash
  grep -rn "localhost:4000" apps/web/src | grep -v "lib/api.ts"   # doit être vide
  ```
- [ ] **T3.24** — Faire passer `pnpm typecheck` sur web et API.

**Critère de sortie**
```bash
pnpm typecheck                                    # passe
curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:4000/api/admin/brands          # 401
curl "http://localhost:4000/api/v1/search?q=l'apostrophe"   # ne casse rien
```
Aucun fichier backend ne dépasse 300 lignes.

---

## Phase 4 — Reconstruire le parcours public · 3 à 4 jours

> **Verticalement, dans cet ordre.** À chaque étape : API, interface responsive, états vides et erreurs, contrôle de types, test du parcours — **avant** de passer à la suivante. Le JSX existant est réutilisable à ~80 % ; c'est le mode de rendu qui change.

- [ ] **T4.1** — Liste des marques : pagination, filtres, recherche.
- [ ] **T4.2** — Fiche marque + SEO complet.
- [ ] **T4.3** — Régions, secteurs, carte.
- [ ] **T4.4** — Catalogue et fiche produit.
- [ ] **T4.5** — Recherche unifiée marques + produits.
- [ ] **T4.6** — Favoris et profil utilisateur.

Transversal à ces six étapes :

- [ ] **T4.7** — Basculer les pages publiques en Server Components. `'use client'` uniquement sur les feuilles interactives.
- [ ] **T4.8** — `generateMetadata` sur chaque page publique (titre, description, Open Graph, canonique).
- [ ] **T4.9** — `generateStaticParams` + ISR sur fiches marque et produit.
- [ ] **T4.10** — Migrer les 40 `<img>` vers `next/image` et déclarer les hôtes réels dans `next.config.js` : `cdn.shopify.com`, `res.cloudinary.com`, `www.google.com`, les domaines WordPress. **Aucun n'y figure aujourd'hui** (seulement AWS, Cloudflare et Unsplash).
- [ ] **T4.11** — JSON-LD : `Organization` sur les marques, `Product` sur les produits.
- [ ] **T4.12** — `sitemap.ts` alimenté par la base + `robots.ts`.
- [ ] **T4.13** — Rétablir une protection réelle des routes `/admin` et `/studio` dans `middleware.ts`.

**Critère de sortie**
```bash
curl -s http://localhost:3000/marques/<un-slug> | grep -c "<h1"   # >= 1
```
Lighthouse SEO ≥ 95 et LCP < 2,5 s sur une fiche marque.

---

## Phase 5 — Qualité des données · 2 à 3 jours

> C'est ce qui décide si le site paraît sérieux ou bâclé. « 40 000 produits » est un chiffre de communication ; la vraie question est combien sont affichables.

- [ ] **T5.1** — Script d'audit `pnpm data:audit` : combien de produits ont une image valide, un prix, une URL d'achat qui répond en 200.
- [ ] **T5.2** — Vérificateur de liens sur `externalBuyUrl` → désactiver automatiquement les 404. Un lien mort coûte plus de confiance qu'un produit manquant.
- [ ] **T5.3** — Dédoublonner et filtrer le bruit : cartes cadeaux, échantillons, variantes en double, produits de test.
- [ ] **T5.4** — Contrôles qualité sur les marques : URL valide, secteur et région reconnus, doublons, géolocalisation, statut de vérification.
- [ ] **T5.5** — **Rendre l'import idempotent — priorité haute.** Le catalogue sera rescrappé régulierement (c'est peu couteux : quelques heures), donc la regle de fusion est centrale. Aujourd'hui, relancer un scraper peut dupliquer des lignes ou ecraser un enrichissement paye en appels de modele. Il faut une cle stable par produit et une regle explicite : le scraping met a jour prix, stock, images et URL ; il ne touche **jamais** aux champs enrichis ni au travail editorial.
- [ ] **T5.6** — **Tracer la provenance** : source (Shopify, WooCommerce, manuel) et date de collecte pour chaque produit. Sans ça, impossible de savoir ce qui est périmé ni ce qu'un réimport a le droit de remplacer.
- [ ] **T5.7** — Relancer l'enrichissement IA uniquement sur les champs manquants.
- [ ] **T5.8** — Ne publier que les produits au-dessus du seuil de complétude (`status = ACTIVE` piloté par l'audit).

**Critère de sortie** : `pnpm data:audit` affiche les taux de complétude, et un réimport complet ne crée aucun doublon ni ne perd aucun enrichissement.

---

## Phase 6 — Tests et intégration continue · 2 jours

> Pas de course à la couverture. On teste les chemins dont la casse silencieuse coûte cher.

- [ ] **T6.1** — Installer Vitest.
- [ ] **T6.2** — Tests unitaires : garde-fous d'auth (un non-admin reçoit bien 403), scoring de recherche, construction des requêtes, logique d'import.
- [ ] **T6.3** — Tests d'intégration API sur une base PostgreSQL temporaire.
- [ ] **T6.4** — Installer Playwright.
- [ ] **T6.5** — Parcours navigateur : recherche → marque → produit → clic d'achat ; inscription ; connexion ; favoris ; revendication de marque ; édition Studio ; édition admin.
- [ ] **T6.6** — GitHub Actions : `install` → `prisma generate` → `typecheck` → `lint` → `test` sur chaque PR.
- [ ] **T6.7** — Le rouge bloque la fusion.

**Critère de sortie** : casser volontairement un garde-fou d'auth fait échouer la CI sans vérification manuelle.

---

## Phase 7 — Mise en ligne · 1 à 2 jours

- [ ] **T7.1** — Front sur Vercel ; PostgreSQL managé (Neon ou Supabase) ; API sur Railway ou Render si l'option B a été retenue.
- [ ] **T7.2** — Préproduction avec sa propre base, alimentée par les branches, sur données anonymisées ou copie contrôlée.
- [ ] **T7.3** — Sentry (erreurs) + PostHog (usage). Les deux clés sont déjà prévues dans `.env`.
- [ ] **T7.4** — Sauvegardes automatiques de la base + alertes.
- [ ] **T7.5** — **Conformité** — non négociable pour un site français avec comptes et analytics : politique de confidentialité, mentions légales, bandeau de consentement réellement bloquant pour PostHog, suppression de compte et export des données, et mention claire sur l'origine des données des marques (le site republie des informations et des images collectées sur des sites tiers).
- [ ] **T7.6** — Domaine, Search Console, soumission du sitemap.
- [ ] **T7.7** — Déploiement progressif : catalogue public d'abord, comptes ensuite, Studio en dernier.

**Critère de sortie** : un `git push` sur `main` met le site à jour, et une fiche marque est indexée dans la Search Console.

---

## Phase 8 — Réintroduire le B2B, le paiement et l'IA

> L'ordre est contraint : on ne peut pas vendre ce qu'on ne mesure pas.

### B2B et paiement

- [ ] **T8.1** — Fiche marque revendiquée et éditable, avec validation manuelle.
- [ ] **T8.2** — **Instrumenter les vrais événements** : vues de fiche, clics sortants, mises en favori.
- [ ] **T8.3** — Reconstruire le tableau de bord sur ces événements. Supprimer tous les `Math.random()` de `index.ts:3063-3067` et de `statistiques/page.tsx:68-69`.
- [ ] **T8.4** — Définir ce que Premium apporte concrètement, une fois les vrais chiffres visibles.
- [ ] **T8.5** — Stripe : autorisation de la marque vérifiée serveur, webhooks signés, tests des cas d'échec, portail client.
- [ ] **T8.6** — **Le navigateur ne choisit jamais librement la marque ni le niveau d'abonnement à facturer.** Le serveur dérive les deux du token et de la propriété en base.

### IA

- [ ] **T8.7** — Choisir un fournisseur principal derrière une abstraction simple. Aujourd'hui la doc promet OpenAI, le serveur appelle Claude, et le chemin OpenAI renvoie une 400 volontaire (`index.ts:2817`).
- [ ] **T8.8** — Clés exclusivement côté serveur.
- [ ] **T8.9** — Faire d'abord fonctionner une **recommandation déterministe** à partir des filtres et des produits vérifiés.
- [ ] **T8.10** — Poser l'IA conversationnelle en surcouche de cette recherche. Le catalogue ne doit jamais dépendre d'un appel de modèle pour fonctionner.
- [ ] **T8.11** — Plafonner coût, débit et longueur de conversation.
- [ ] **T8.12** — Embeddings et recherche sémantique **seulement** après évaluation de la qualité réelle des données produit, et après avoir installé pgvector (absent aujourd'hui).

### Montées de version

- [ ] **T8.13** — Next 15, Prisma 6, NextAuth v5 — **jamais avant la CI de la phase 6**, sinon on ne sait pas ce que la montée a cassé.

---

## Estimation

| Phase | Effort | Ce que ça débloque |
|---|---|---|
| 0 · Figer et sécuriser | 0,5 j | Le droit à l'erreur |
| 1 · Périmètre et doublons | 1 j | Une IA qui modifie le bon fichier |
| 2 · Base reproductible | 1 j | Un démarrage en une commande |
| 3 · Backend | 4–6 j | Un projet déployable sans danger |
| 4 · Front public et SEO | 3–4 j | Le canal d'acquisition |
| 5 · Qualité des données | 2–3 j | Un site qui inspire confiance |
| 6 · Tests et CI | 2 j | La fin des régressions invisibles |
| 7 · Mise en ligne | 1–2 j | De vrais utilisateurs |
| **Total v1** | **15–20 j** | **≈ 4 à 5 semaines à mi-temps** |

Phase 8 non estimée : elle dépend de ce que révèle la phase 5.

Si tu ne devais faire que trois choses : **la phase 0 aujourd'hui**, **l'authentification de la phase 3**, **le rendu serveur de la phase 4**.

---

## Ce qu'il ne faut pas faire

- **Repartir de zéro.** On perdrait données, schéma et design — tout ce qui a de la valeur — pour reconstruire les mêmes problèmes.
- **Commencer par les fonctionnalités.** La page Produits du Studio est tentante parce qu'elle est visible. Elle sera à refaire après la phase 3.
- **Monter les versions maintenant.** Next 15 et Prisma 6 sans un seul test, c'est une journée de débogage à l'aveugle.
- **Demander « répare tout » à une IA.** Sur ce dépôt, ça produit une quatrième version de l'espace B2B.
- **Reporter la sauvegarde.** Le catalogue brut se rescrape, mais l'enrichissement IA, les geocodages et le travail editorial n'existent que dans un Postgres local, sur une seule machine, sans dump.

---

## Journal de sessions

> Une ligne par session : date, tâches traitées, ce qui a été découvert, ce qui bloque.
> C'est le contexte que lira la session suivante. S'il ment, elle se trompera.

| Date | Tâches | Découvertes / blocages |
|---|---|---|
| 2026-08-30 | Audit initial, `CLAUDE.md` et `REBUILD.md` écrits | pgvector absent malgré ce qu'indiquait `PLAN.md` ; produits non vérifiables hors de la base locale (voir T0.0) |
| 2026-09-01 | Phase 0 (sauf T0.7), phase 1 complète, phase 2 (sauf T2.8) | **Trois découvertes.** (1) La base PostgreSQL n'existe plus : ni Docker, ni Postgres, ni dump, ni répertoire de données. Les ~40 000 produits sont perdus sauf copie ailleurs. (2) `origin/main` (`7878ad4`, 17 fév.) était **en avance** sur le disque de 11 routes et 9 fichiers — l'audit d'août portait sur une copie périmée ; `main` a été réaligné dessus et les correctifs réappliqués sur la vraie base. (3) L'environnement est cassé : `pnpm` absent, Docker absent, Node en v26. **Bloquant pour la phase 2.** Autres faits : un verrou `.git/index.lock` périmé du 30 août bloquait toute écriture git ; le dépôt GitHub est **public** ; aucun `.env` réel n'a jamais été committé ; `apps/api/.env` et `apps/web/.env` sont des liens symboliques vers le `.env` racine. **Phase 2 faite dans la foulée** : Node 22 + pnpm 9.1.0 + PostgreSQL 16.15 (Homebrew, pas Docker) réinstallés, migration `init` régénérée (l'ancienne avait perdu 3 tables), index GIN trigram ajoutés, seed réparé (il référençait des paliers d'abonnement supprimés du schéma), commande unique `pnpm bootstrap`. L'application démarre et sert des marques. **Phase 1 faite ensuite** : `espace-marque` et les doublons d'inscription supprimés (2 028 lignes), 9 liens redirigés vers `/studio`, `README.md` réécrit depuis le code, `PLAN.md` et un troisième document faux (`GETTING_STARTED.md`, non listé par ce plan) archivés, `docs/SPEC-V1.md` écrit. Typecheck web : 22 → 12 erreurs. **Prochain jalon : phase 3, l'authentification.** Reste ouvert : T0.7 (rotation des clés Anthropic/Cloudinary/Google, sans urgence — rien n'a fuité, le projet n'a jamais été déployé et Stripe est en clés de test), T2.8 (le seed ne produit que 4 marques ; l'import des 996 marques de `brands.xlsx` est à faire), et la recherche de la base sur une autre machine. |
|  |  |  |
