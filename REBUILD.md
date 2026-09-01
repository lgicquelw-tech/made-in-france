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

### Des pages d'administration qui inventaient leurs données

Découvert le 1er septembre 2026 en migrant les routes. **Cinq pages** fabriquaient des
données dès que leur appel échouait — et l'appel échouait en permanence, trois des routes
appelées n'ayant jamais existé (`GET /api/admin/products`, `/users`, `/subscriptions`).

| Page | Ce qu'elle affichait |
|---|---|
| `/admin` | 902 marques, 39 835 produits, 1 847 utilisateurs, 45 230 vues, et un fil d'activité inventé **affiché même quand tout fonctionnait** |
| `/admin/produits` | 5 produits fictifs, « 39 835 produits, 1992 pages » |
| `/admin/utilisateurs` | 5 utilisateurs fictifs, noms et adresses e-mail vraisemblables |
| `/admin/abonnements` | 5 abonnements présentant **des entreprises réelles et nommées** comme clientes payantes, identifiants Stripe inventés, 1 847 € de revenu mensuel |
| `/admin/collections` | une liste de collections en dur ; cette page n'appelait **aucune** API |

Le cas des abonnements est le plus grave : sur un écran d'administration, une entreprise
nommée présentée comme cliente payante est indiscernable de la vérité.

Tout cela a été supprimé. Les pages affichent désormais un état vide et une erreur en
console, et les trois routes manquantes ont été créées sur de vraies données. Reste à
faire : un vrai état d'erreur visible à l'écran, et le branchement de `/admin/collections`
sur ses endpoints (qui existent et sont protégés depuis cette session).

### D'où venait le chiffre de « 39 835 produits »

Découvert le 1er septembre 2026 en migrant les routes produit : **il était écrit en dur
dans le frontend.**

- `apps/web/src/app/admin/produits/page.tsx` appelait `GET /api/admin/products` — une route
  **qui n'a jamais existé** côté Express. L'appel échouait donc systématiquement, et la page
  retombait sur cinq produits fictifs en affichant « 39 835 produits, 1992 pages ».
- `apps/web/src/app/admin/page.tsx` contenait le même chiffre en dur
  (`products: { total: 39835, active: 38500 }`), plus 902 marques, 1 847 utilisateurs,
  45 230 vues et un fil d'activité entièrement inventé — affiché **même quand tout
  fonctionnait**.
- `apps/web/src/app/admin/utilisateurs/page.tsx` affichait cinq utilisateurs fictifs avec
  noms et adresses e-mail vraisemblables.

`PLAN.md` annonçait « 39 835 produits actifs ». Le raisonnement était circulaire : le
document citait un chiffre que l'interface fabriquait.

Cela ne prouve pas que les produits n'ont jamais existé — `enrichment-test-results.json`
contient de vrais UUID Postgres. Mais **ce chiffre n'a jamais été une preuve de quoi que
ce soit.** Toutes ces données inventées ont été supprimées : les pages affichent désormais
un état vide et une erreur en console. Un tableau de bord vide est préférable à un tableau
de bord qui ment.

**Conclusion : sur cette machine, le catalogue produit est perdu.** Il ne peut subsister
que sur une autre machine ou dans une sauvegarde distante. À confirmer par toi.

Conséquence si la copie n'existe pas : le seul actif de données versionné est
`data/brands.xlsx` (996 marques). La v1 devient un annuaire de marques, le catalogue
produit se reconstruit par les scrapers en phase 5, et les phases 5 et 6 changent d'échelle.

---

## 2. Les 15 constats vérifiés

### Un huitième constat, absent de l'audit — la revendication de marque

Découvert le 1er septembre 2026 en migrant les routes d'authentification. **C'était la
faille la plus grave du projet, et le plan ne la mentionnait nulle part.**

Deux routes accordaient la propriété d'une marque, sans aucune vérification :

- `POST /api/auth/claim-brand` prenait `userId` et `brandSlug` **dans le corps de la
  requête**, sans authentification, et créait aussitôt un `BrandOwner` avec
  `role: OWNER, isActive: true`. Une seule requête suffisait à devenir propriétaire de
  n'importe laquelle des 903 marques — pour soi, ou pour le compte de quelqu'un d'autre.
- `POST /api/auth/register` faisait la même chose dès qu'on lui passait un
  `claimBrandSlug`.

Le schéma prévoyait pourtant le bon dispositif — `BrandClaimRequest`, avec un statut
`PENDING`, des champs de preuve et un examen (`reviewedBy`, `reviewedAt`). Il n'était
simplement pas utilisé.

Corrigé : `claim-brand` est supprimée (plus rien ne l'appelait depuis la phase 1), et
`register` crée désormais une **demande en attente**, jamais une propriété. Vérifié de
bout en bout : après inscription avec revendication, `brand_owners` reste vide et le
compte reçoit **403** sur le tableau de bord, l'écriture et l'envoi d'images de la marque
qu'il prétend revendiquer.

La validation humaine de ces demandes reste à construire (T8.1).

### Critiques — bloquent toute mise en ligne

| # | Constat | Preuve |
|---|---|---|
| 1 | **L'API n'a aucune authentification.** ~85 routes ouvertes, dont `DELETE /api/admin/brands/:id`, les uploads et Stripe. Zéro middleware. | `apps/api/src/index.ts` — 0 occurrence de `requireAuth`/`verifyToken`/`Bearer` |
| 2 | ~~**L'admin est « protégé » par le navigateur.**~~ **Corrigé le 1er septembre 2026.** Le garde du navigateur a été remplacé par `useSession` (affichage) + le middleware (routage) + `requireAdmin` (autorisation, relue en base). Aggravant découvert au passage : le middleware ne s'exécutait même pas, mauvais emplacement de fichier. |
| 3 | ~~**L'identité circule en query string.**~~ **Corrigé le 1er septembre 2026** (T3.12). Elle circulait sous trois formes, dont une — `:userId` dans le chemin — que le constat d'origine ne mentionnait pas. |
| 4 | ~~**Injection SQL, chemin public.**~~ **Corrigé le 1er septembre 2026** (T3.17). Il y avait **deux** foyers, pas un : les outils du chat, et `GET /api/v1/products`, où `?sector=` était concaténé. |
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
| 15 | ~~**Les statistiques vendues aux marques sont inventées.**~~ **Côté API : corrigé le 1er septembre 2026.** `views`, `clicks` et `conversionRate` valent désormais `null` — et non un nombre — tant qu'il n'existe pas de vrais événements (T8.2). `favorites` et `products` sont de vrais comptages. **Reste à faire :** la page `studio/marque/[slug]/statistiques` génère encore ses propres courbes aléatoires côté client. |

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
- [x] **T2.7** — Il n'y avait pas 5 fichiers : `apps/api/.env` et `apps/web/.env` sont des **liens symboliques** vers le `.env` racine. Vrais fichiers : `.env` (34 clés) et `apps/web/.env.local` (9 clés NextAuth). `.env.example` complété : les 7 clés manquantes (Cloudinary, SMTP) ajoutées, toutes valeurs vides.
  ⚠️ **Piège découvert :** ces liens symboliques sont **ignorés par git** — ils n'existent donc pas sur un clone neuf. Toute commande qui en dépendait aurait échoué sur une machine vierge. `prisma` et `tsx` ont été ajoutés aux dépendances de la racine et **toutes les commandes `db:*` tournent désormais depuis la racine**, là où se trouve le `.env`. Plus aucun lien symbolique n'est nécessaire. (À noter : `node --env-file` refuse les chemins commençant par `../`, ce qui interdisait le contournement évident.)
- [x] **T2.8** — Le seed existant **plantait** : il déclarait les paliers `STARTER` et `STANDARD`, disparus du schéma (qui a `FREE`/`PREMIUM`/`ROYALE`). Réécrit sur les trois vrais paliers, aux tarifs réellement affichés par le Studio (0 € / 29 € / 99 €), avec `update` rempli au lieu de `update: {}` — relancer le seed corrige désormais une ligne qui a dérivé au lieu de la laisser en l'état.
  **Les 903 marques de `data/brands.xlsx` sont importées** et l'import fait partie de `pnpm bootstrap`. La base de développement contient 13 régions, 9 secteurs, 11 catégories, 6 labels, 3 paliers et **903 marques**, dont **0 sans secteur**.
  Trois défauts corrigés au passage, tous silencieux :
  - **`scripts/` n'était pas dans `pnpm-workspace.yaml`** alors qu'il déclare ses propres dépendances. `pnpm install` ne les installait jamais : sur une machine vierge, aucun script d'import ni de scraping ne fonctionnait.
  - **Trois marques réelles étaient perdues à chaque import** — `909`, `1083` et `1336`, dont le nom est purement numérique. XLSX les lit comme des nombres et la validation les rejetait comme « nom manquant ou invalide ».
  - **687 marques sur 903 se retrouvaient sans secteur.** Le seed déclarait une taxonomie (`Mode`, `Maison`, `Cosmétiques`, `Enfants`, `Sport & Loisirs`, `Artisanat`, `Jardin & Extérieur`) différente de celle utilisée par le front, le sitemap, le script d'import **et** le fichier source. Le seed a été aligné sur la taxonomie canonique à 9 secteurs. Le filtre par secteur — fonctionnalité n°1 de `docs/SPEC-V1.md` — ne servait à rien.

- [x] **T2.9** — `slug`, `status`, `brand_id`, `sector_id`, `region_id` existaient déjà via le schéma. Seuls manquaient les index GIN trigram : ajoutés dans `schema.prisma` (`@@index([name(ops: raw("gin_trgm_ops"))], type: Gin)`) et migrés (`20260901072814_index_trigram_recherche`). Vérifié : le planificateur les utilise (`Bitmap Index Scan on brands_name_idx`).
- [x] **T2.10** — ⚠️ **La commande s'appelle `pnpm bootstrap`, pas `pnpm setup`** : `setup` est une commande **interne** de pnpm (elle configure `PNPM_HOME` dans le shell) et masque silencieusement tout script du même nom. Enchaîne `install --frozen-lockfile` → `db:generate` → `db:migrate:prod` → `db:seed` → `db:import`. Testée deux fois, rejouable.

**Critère de sortie** — atteint le 1er septembre 2026, à une réserve près :

```bash
pnpm bootstrap   # install + generate + migrate + seed + import des 903 marques
pnpm dev         # web 3000 + api 4000, prêts en 2,5 s
curl "http://localhost:4000/api/v1/sectors/with-counts"   # 9 secteurs, 903 marques ✅
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/secteurs/mode-accessoires  # 200 ✅
```

Vérifié sans aucun lien symbolique `.env` présent, donc dans les conditions d'un clone neuf.
`pnpm bootstrap` relancé sur une base déjà peuplée : **0 création, 903 mises à jour, 0 erreur.**

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
- [~] **T3.2** — **Arbre `/api/admin/brands/*` migré** (9 routes) vers des Route Handlers Next.js, tous derrière `requireAdmin` — `DELETE` derrière `requireSuperAdmin`, car il emporte en cascade produits, images, propriétaires et demandes de revendication. Aucun fichier ne dépasse 115 lignes. Les routes marques **publiques** restent à migrer.
- [x] **T3.3** — **Les 9 routes produit migrées** derrière `requireAdmin` (`activate-all` derrière `requireSuperAdmin` : publier tout le catalogue d'un coup contredit T5.8). Express : 73 → 65 routes. Le piège d'ordre des routes Express — `/search` et `/trending` devant `/:id` — **disparaît** : en App Router, un segment statique prime toujours sur un segment dynamique.
  La recherche reste en SQL brut (score de pertinence et `similarity()` de `pg_trgm`, donc l'index GIN de T2.9) mais en `$queryRaw` **balisé** : chaque valeur est un paramètre lié. Vérifié avec `q=l'apostrophe`.
  Trois bugs corrigés : `GET /api/admin/products` n'existait pas (voir §1), une mise à jour partielle effaçait tags, matières, galerie et attributs, et un prix minimum supérieur au maximum était accepté sans rien dire.
- [ ] **T3.4** — Migrer la recherche.
- [x] **T3.5** — **L'arbre `/api/admin/*` est entièrement migré** : plus une seule route d'administration côté Express. 92 → 53 routes, et `index.ts` passe de 4 385 à 3 162 lignes. Toutes derrière `requireAdmin` ; `DELETE` d'une marque ou d'un label et `activate-all` derrière `requireSuperAdmin`. Validation Zod partout. Aucun fichier ne dépasse 115 lignes.
  **Trois routes appelées par le front n'existaient nulle part** — `GET /api/admin/products`, `GET /api/admin/users` et `GET /api/admin/subscriptions`. Créées. Voir §1 pour ce que cachait leur absence.
  Les réglages IA ne peuvent plus fuir ni stocker de clé : double filtre (schéma Zod fermé + filtre par nom de champ), et le chat ne lit plus les clés que depuis l'environnement — la lecture depuis la base a été retirée, c'est elle qui rendait tentant d'en stocker.
  Deux chiffres faux corrigés : le tableau de bord comptait **toutes** les marques comme actives (`active: brandsTotal`, `pending: 0`), et `labels/:id/usage` renvoyait `totalProducts` calculé sur une liste tronquée à 50. Restent à migrer : produits, collections, mises en avant, réglages IA.
- [ ] **T3.6** — Migrer l'espace marque.
- [ ] **T3.7** — Migrer médias, paiements, IA.
- [ ] **T3.8** — Supprimer l'ancien `index.ts` une fois toutes les routes migrées et vérifiées.

### 3b — Authentification et droits

- [x] **T3.9** — **Fusionné.** `AdminUser` (identité parallèle avec son propre mot de passe) a disparu ; `User` porte désormais un `role` (`USER` / `ADMIN` / `SUPER_ADMIN`) et un `isActive`. Migration `20260901084144_fusion_admin_user_dans_user`. Les trois tables (`users`, `admin_users`, `brand_owners`) étaient **vides** : c'était le moment le moins coûteux pour le faire, et il ne se représentera pas. La propriété de marque vivait déjà sur `User` via `ownedBrands`.
- [~] **T3.10** — Rôles en base : fait (`UserRole`, index sur `role`). La vérification serveur existe (voir T3.11) mais n'est pas encore appliquée aux routes : c'est la migration des Route Handlers qui reste.
- [x] **T3.11** — `apps/web/src/lib/guards.ts` : `requireUser`, `requireAdmin`, `requireSuperAdmin`, `requireBrandOwner(slug)`.
  Deux partis pris : **le rôle est relu en base à chaque requête** (le JWT est signé donc infalsifiable, mais c'est une photographie prise à la connexion — un compte rétrogradé garderait ses droits jusqu'à expiration) ; et `requireBrandOwner` exclut explicitement le rôle `VIEWER`, qui est un rôle de lecture.
  Fondations posées avec : `lib/db.ts` (singleton Prisma — `route.ts` faisait `new PrismaClient()` au niveau du module, ce qui ouvre une connexion par rechargement en dev et par invocation à froid en serverless), `lib/auth.ts` (`authOptions` extraits, réutilisables par `getServerSession`), `lib/api-response.ts` (`HttpError`, réponses uniformes, 500 générique qui ne fuite rien) et `types/next-auth.d.ts`.
- [x] **T3.12** — **L'identité ne vient plus jamais du client.** Les trois formes ont été supprimées : `?userId=` (tableau de bord, propriété, propriétaires), `?email=` (`/api/v1/user/brands`, qui permettait d'énumérer les marques de n'importe quelle adresse), et `:userId` **dans le chemin** (favoris, vues, profil) — cette dernière forme n'était pas couverte par le critère d'origine, qui ne cherchait que dans la query. Les routes utilisateur sont devenues `/api/v1/me/*` : une forme où l'on ne peut plus exprimer l'identité autrement que par la session.
  ```bash
  grep -rn "userId" apps/api/src | grep -iE "req.query|query.userId"   # vide ✅
  grep -rn "req.query.email" apps/api/src                                # vide ✅
  grep -rnE "app.\\w+\\('[^']*:userId" apps/api/src                        # vide ✅
  ```
  ```bash
  grep -rn "userId" apps/api/src | grep -i "query\|req.query"   # doit devenir vide
  ```
- [x] **T3.13** — **Chaque écriture B2B vérifie la propriété en base.** Vérifié compte contre compte : un utilisateur connecté qui n'est pas propriétaire reçoit **403** sur le tableau de bord (lecture et écriture), la liste des propriétaires, l'ajout de label et l'envoi d'image ; le propriétaire reçoit 200. Trois de ces routes n'avaient **aucun** contrôle auparavant : ajouter un label, envoyer une image et supprimer une image de n'importe quelle marque était ouvert à tous.
  ⚠️ À qualifier : la **coquille** des pages `/studio/marque/[slug]` reste accessible à tout compte connecté — le middleware ne vérifie que l'authentification, pas la propriété (il faudrait un appel en base sur l'edge). Vérifié qu'aucune donnée ne fuit : les deux pages font exactement la même taille, le contenu arrive côté client et l'API répond 403.
- [ ] **T3.14** — Piste d'audit : qui a modifié quoi, quand, sur les fiches marque.
- [x] **T3.15** — Remplacé par une commande locale : **`pnpm admin:create`** (`scripts/create-admin.ts`). Une commande locale n'est appelable que par quelqu'un qui a déjà accès au serveur et à la base : c'est le bon niveau de privilège pour créer un administrateur.
  Le mot de passe est saisi sans écho et **jamais passé en argument** — il finirait sinon dans l'historique du shell et dans la liste des processus. Minimum 12 caractères, confirmation exigée, hachage bcrypt en 12 tours. Le premier compte est `SUPER_ADMIN`, les suivants `ADMIN` ; un compte existant est promu plutôt que refusé.
  Testé : les trois refus (e-mail invalide, mot de passe trop court, confirmation différente), la création, la promotion, et l'attribution des rôles.

### 3c — Robustesse

- [ ] **T3.16** — Schéma Zod en entrée de chaque endpoint, réponse typée.
- [x] **T3.17** — **Plus aucun `$queryRawUnsafe` dans le projet.** Il y en avait quatre, réparties sur **deux** foyers, pas un seul comme le laissait croire le constat n°4 :
  - `executeSearchProducts` et `executeSearchBrands` (outils du chat) : `p.name ILIKE '%${k}%'` concaténé, plus `sector`, `target` et les bornes de prix. Les arguments viennent du modèle, donc en dernier ressort de ce que l'utilisateur écrit.
  - `GET /api/v1/products` : les termes de recherche **étaient** liés (`$1`…`$6`), mais `?sector=` était concaténé — sur une route publique, sans authentification.
  Tout passe par `Prisma.sql` et `Prisma.join`, où chaque valeur devient un paramètre lié. Le `ORDER BY` reste construit en code — une clause de tri ne peut pas être un paramètre lié — mais depuis une liste blanche.
  Vérifié avec de vraies charges : `' OR '1'='1`, `x'; DROP TABLE products; --`, `%' UNION SELECT NULL--` et `l'apostrophe` renvoient toutes une réponse vide sans erreur, tables intactes. Et la recherche fonctionne toujours : insensible aux accents, filtres secteur et prix, tris.
  ```bash
  grep -rn "queryRawUnsafe" apps/api/src   # plus aucune occurrence exécutable ✅
  ```
  ```bash
  grep -rn "queryRawUnsafe" apps/api/src   # zéro, ou uniquement avec des paramètres liés
  ```
- [x] **T3.18** — Import `Stripe` dédoublonné et version d'API figée dans une constante unique `STRIPE_API_VERSION`, utilisée par une fabrique `stripeClient()`. Elle était répétée à trois instanciations, sous une valeur de décembre 2024 que le SDK installé (stripe v20) **n'accepte plus** — le fichier ne compilait pas.
- [ ] **T3.19** — **Aucun secret en base ni en réponse HTTP.** Les réglages IA ne stockent qu'un nom de modèle et une température.
- [x] **T3.20** — Uploads : **type MIME réel vérifié** (JPEG, PNG, WebP, AVIF — l'ancienne route n'en contrôlait aucun et acceptait `resource_type: 'auto'`), taille plafonnée, propriété de la marque exigée, quota par palier d'abonnement conservé. Le paramètre `?folder=` d'`/api/upload` partait tel quel dans le chemin Cloudinary : il passe désormais par une liste blanche. `/api/upload/multiple` et le `DELETE` par `publicId` ont été supprimés : personne ne les appelait, et ils permettaient d'effacer n'importe quel média du compte Cloudinary.
- [ ] **T3.21** — Limitation de débit sur `/chat`, `/search`, `/upload`.
- [ ] **T3.22** — Gestionnaire d'erreurs centralisé, logs structurés (pino), suppression des 35 `console.log`.
- [ ] **T3.23** — Centraliser l'accès aux données côté web dans `lib/api.ts` et éliminer les 57 `localhost:4000`.
  ```bash
  grep -rn "localhost:4000" apps/web/src | grep -v "lib/api.ts"   # doit être vide
  ```
- [x] **T3.24** — **`pnpm typecheck` passe sur les 7 tâches du monorepo.**
  Découverte au passage : `apps/api` et `scripts/` **n'avaient aucun script `typecheck`**. Turbo les comptait comme « réussis » parce que la tâche n'existait pas — les 4 358 lignes de l'API n'avaient jamais été vérifiées. Scripts ajoutés, plus un `tsconfig.json` pour `scripts/` qui n'en avait pas.
  L'API révélait alors **44 erreurs**, dont 31 dues à `@prisma/client` non déclaré dans ses dépendances (même défaut que T2.3 côté web). Les 13 restantes étaient de vrais bugs, décrits ci-dessous.

### Bugs révélés par le premier typecheck de l'API

Aucun ne produisait d'erreur visible. Tous sont corrigés.

| Bug | Effet réel |
|---|---|
| `prisma.brand.create({ email, phone })` | `Brand` n'a ni `email` ni `phone`. Prisma rejette un argument inconnu : **toute création de marque depuis l'administration échouait**. |
| Tableau de bord Studio : `brand.description`, `brand.email`, `brand.phone`, `brand.photos` | Quatre champs inexistants, renvoyés en `undefined` depuis toujours. Corrigés en `descriptionShort` / `descriptionLong` / relation `images` ; `email` et `phone` retirés. |
| `product.updateMany({ where: { status: 'INACTIVE' } })` | `INACTIVE` n'est pas un `ProductStatus` (`DRAFT`, `ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`). La route « activer tous les produits » **ne faisait rien**. Ramenée à `DRAFT` — ni `OUT_OF_STOCK` (un fait de stock) ni `DISCONTINUED` (un retrait volontaire). |
| Import `Stripe` en double + version d'API périmée | Le fichier ne compilait pas. Voir T3.18. |

⚠️ **Écart de modèle à trancher.** La page `studio/marque/[slug]/parametres` propose des
champs « e-mail » et « téléphone » liés à `brand.email` et `brand.phone`, **qui n'existent
pas dans le schéma**. Ces champs sont vides depuis toujours et ne sauvegardent rien.
Ajouter les colonnes serait ajouter une fonctionnalité : à décider explicitement, pas à
glisser au passage.

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
- [x] **T4.13** — **Le middleware ne s'exécutait pas du tout.** Il était dans `apps/web/middleware.ts` alors que le projet utilise un répertoire `src/`, où Next.js attend `apps/web/src/middleware.ts`. Vérifié : l'en-tête `x-pathname` qu'il prétendait poser n'apparaissait dans aucune réponse — `/admin` et `/studio` étaient donc entièrement ouverts. Déplacé et rendu effectif : anonyme → redirection vers `/connexion`, connecté sans droits → 404, administrateur → 200. `/studio/connexion`, `/studio/inscription` et `/studio/revendiquer` restent ouverts, sinon personne ne pourrait plus se connecter.

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

### ⚠️ Décision à prendre : 902 marques sur 903 ne sont pas publiables

Découvert le 1er septembre 2026 en migrant le tableau de bord d'administration.

| | |
|---|---|
| `PENDING_REVIEW` | **902** |
| `ACTIVE` | **1** (Armor Lux, venue du seed) |

C'est **volontaire côté import** : `import-brands.ts` pose `PENDING_REVIEW`, ce qui est
la bonne valeur par défaut — on ne publie pas 903 fiches sans les avoir regardées.

Le problème est ailleurs : **`GET /api/v1/brands` ne filtre pas sur le statut** et renvoie
les 903, tandis que d'autres routes publiques filtrent bien sur `ACTIVE`. Le catalogue
public est donc incohérent avec lui-même, et il publie déjà des fiches non relues.

Deux issues, à trancher explicitement :

1. **Filtrer** `/api/v1/brands` sur `ACTIVE` — cohérent, mais le site public n'affiche
   plus qu'une seule marque tant que la relecture n'a pas eu lieu.
2. **Passer les 903 en `ACTIVE`** après un audit de qualité (T5.1) — c'est le sens de la
   phase 5, et la seule option qui donne un site présentable.

L'option 2 est la bonne, mais elle **suppose l'audit fait**. En attendant, ne pas
« corriger » le filtre sans décider : cela viderait le site sans prévenir.

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
| 2026-09-01 | Phases 0 (sauf T0.7), 1 et 2 complètes ; T3.9, T3.11, T3.15, T3.18, T3.24, T4.13 ; T3.2 et T3.13 partiels | **Trois découvertes.** (1) La base PostgreSQL n'existe plus : ni Docker, ni Postgres, ni dump, ni répertoire de données. Les ~40 000 produits sont perdus sauf copie ailleurs. (2) `origin/main` (`7878ad4`, 17 fév.) était **en avance** sur le disque de 11 routes et 9 fichiers — l'audit d'août portait sur une copie périmée ; `main` a été réaligné dessus et les correctifs réappliqués sur la vraie base. (3) L'environnement est cassé : `pnpm` absent, Docker absent, Node en v26. **Bloquant pour la phase 2.** Autres faits : un verrou `.git/index.lock` périmé du 30 août bloquait toute écriture git ; le dépôt GitHub est **public** ; aucun `.env` réel n'a jamais été committé ; `apps/api/.env` et `apps/web/.env` sont des liens symboliques vers le `.env` racine. **Phase 2 faite dans la foulée** : Node 22 + pnpm 9.1.0 + PostgreSQL 16.15 (Homebrew, pas Docker) réinstallés, migration `init` régénérée (l'ancienne avait perdu 3 tables), index GIN trigram ajoutés, seed réparé (il référençait des paliers d'abonnement supprimés du schéma), commande unique `pnpm bootstrap`. L'application démarre et sert des marques. **Phase 1 faite ensuite** : `espace-marque` et les doublons d'inscription supprimés (2 028 lignes), 9 liens redirigés vers `/studio`, `README.md` réécrit depuis le code, `PLAN.md` et un troisième document faux (`GETTING_STARTED.md`, non listé par ce plan) archivés, `docs/SPEC-V1.md` écrit. Typecheck web : 22 → 12 erreurs. **Puis import des 903 marques**, qui a révélé trois défauts silencieux : `scripts/` absent de `pnpm-workspace.yaml` (aucun script ne fonctionnait sur une machine vierge), trois marques à nom numérique (`909`, `1083`, `1336`) rejetées à chaque import, et surtout **687 marques sur 903 sans secteur** parce que la taxonomie du seed différait de celle du front, du sitemap, du script d'import et du fichier source. Corrigé et vérifié : 0 marque sans secteur. Trou de la phase 2 rebouché au passage — les liens `.env` sont ignorés par git, donc absents d'un clone neuf ; toutes les commandes `db:*` tournent désormais depuis la racine. **Première tranche de la phase 3 ensuite** : `AdminUser` fusionné dans `User` avec un rôle (les trois tables étaient vides — le moment le moins coûteux, et il ne se représentera pas) ; fondations posées (`lib/db.ts` singleton Prisma, `lib/auth.ts`, `lib/guards.ts`, `lib/api-response.ts`, types NextAuth) ; `pnpm admin:create` remplace la route de création d'admin ouverte. **`pnpm typecheck` passe désormais sur les 7 tâches** — et on a découvert que `apps/api` et `scripts/` n'avaient jamais eu de script `typecheck` du tout : l'API cachait 4 bugs silencieux, dont une création de marque qui échouait systématiquement. ⚠️ **Rien n'est encore protégé** : les gardes existent mais aucune route ne les utilise. **Puis les 9 routes de `/api/admin/brands/*` migrées** vers Next.js derrière `requireAdmin` (Express : 92 → 82 routes). Ce sont les **premières routes authentifiées du projet**. Le passage par Next.js n'est pas un choix esthétique : le cookie de session n'est envoyé qu'en même origine, donc les appels vers `localhost:4000` n'auraient jamais pu être authentifiés. **Découverte majeure : le middleware ne s'exécutait pas du tout** — mauvais emplacement de fichier (`apps/web/middleware.ts` au lieu de `src/`) ; le constat n°2 était donc pire que décrit. `/admin` et `/studio` sont maintenant fermés côté serveur. Deux bugs corrigés en migrant : une mise à jour partielle vidait la galerie et les réseaux sociaux d'une marque, et un slug déjà pris remontait en 500. **Puis l'arbre `/api/admin/*` entièrement migré** : plus une seule route d'administration côté Express (92 → 53 routes, `index.ts` de 4 385 à 3 162 lignes). Découverte la plus lourde de la session : **cinq pages d'administration inventaient leurs données** dès que l'appel échouait — et il échouait en permanence, trois routes appelées n'ayant jamais existé. C'est de là que venait le « 39 835 produits » de `PLAN.md`. La page des abonnements présentait des entreprises réelles et nommées comme clientes payantes. Tout supprimé, routes manquantes créées sur de vraies données. **Puis l'espace marque et les routes utilisateur migrés** : le constat n°3 est fermé. L'identité circulait sous **trois** formes — `?userId=`, `?email=` et `:userId` dans le chemin, cette dernière non couverte par le critère d'origine. Trois routes B2B (ajout de label, envoi et suppression d'image) n'avaient **aucun** contrôle. Les routes utilisateur deviennent `/api/v1/me/*`. Constat n°15 fermé côté API : les statistiques valent `null` plutôt qu'un `Math.random()`. Express : 92 → **32 routes**, `index.ts` de 4 385 à **2 287 lignes**. **Prochain jalon : `/api/v1/chat`, qui porte l'injection SQL du constat n°4, puis `/api/auth/*` et Stripe.** |Reste ouvert : T0.7 (rotation des clés Anthropic/Cloudinary/Google, sans urgence — rien n'a fuité, le projet n'a jamais été déployé et Stripe est en clés de test), et la recherche de la base sur une autre machine. |
|  |  |  |
