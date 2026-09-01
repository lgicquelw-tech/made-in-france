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

| Mesure | Valeur |
|---|---|
| Code applicatif (hors `node_modules`) | 30 869 lignes |
| `apps/api/src/index.ts` | **3 970 lignes**, ~85 routes |
| `apps/api/src/index.ts.backup` | 3 939 lignes mortes |
| `apps/web` | 21 758 lignes, 46 pages |
| `schema.prisma` | 840 lignes, 35 modèles |
| `data/brands.xlsx` | 996 lignes |
| Fichiers de test | **0** |
| Commits git | **1** (`5ba9c53 Initial commit`) |
| Fichiers non validés dans git | **142** |

### Chiffres à vérifier avant d'arbitrer

`PLAN.md` annonce 902 marques et 39 835 produits actifs. Le dépôt contient bien le fichier source des marques, mais **les produits n'existent que dans le PostgreSQL local** — ils ne sont dans aucun fichier versionné.

`enrichment-test-results.json` contient de vrais UUID Postgres de produits avec leurs marques, et le scraping a bien été mené à son terme fin 2025 / début 2026 : **environ 40 000 produits ont réellement été collectes, en quelques heures de scraping**. La question n'est donc pas de savoir s'ils ont existé, mais s'ils sont **encore** dans le PostgreSQL local sept mois plus tard.

Bonne nouvelle qui change le niveau de risque : les scrapers sont rejouables. Si le catalogue a disparu, `shopify-scraper.ts --all` et `woocommerce-scraper.ts --all` le reconstruisent en quelques heures. **Ce qui ne se régénère pas par un scraping**, en revanche : l'enrichissement IA (tags, matériaux, bénéfices, cible, gamme de prix — payé en appels de modèle), les 872 géocodages, les logos, et tout le travail éditorial fait dans l'admin (`aiGeneratedContent`, sections, tags marque). C'est **ça** le vrai actif irremplaçable, pas les lignes produit brutes.

Avant de dimensionner quoi que ce soit :

```bash
docker compose up -d postgres     # ou brew services start postgresql@16
npx tsx scripts/stats.ts
```

- [ ] **T0.0 — Lancer `scripts/stats.ts` et reporter les chiffres réels ici :**
  - Marques : `____`
  - Marques avec produits : `____`
  - Produits actifs : `____`

Si les produits sont là, ils sont le principal actif du projet. S'ils ont disparu, la v1 se réduit à un annuaire de marques et les phases 5 et 6 changent d'échelle. **Ne pas décider avant d'avoir le chiffre.**

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

- [ ] **T0.1 — Trancher A ou B, et écrire la décision ici en une phrase avec sa raison.**

> Décision : `____________________`

Critère simple : si l'objectif est un site public rapide, bien référencé, maintenable seul → **A**. Si les scrapers et l'enrichissement doivent tourner *dans* l'API → **B**.

---

## Phase 0 — Figer et sécuriser · ½ journée

> Rien d'autre ne commence avant. Aucune de ces tâches ne dépend d'une décision d'architecture.

- [ ] **T0.2** — `pg_dump` de la base complète, horodaté, copié **hors de la machine** (disque externe ou stockage distant). Les produits bruts se rescrapent en quelques heures ; l'enrichissement IA, les géocodages, les logos et le travail éditorial fait dans l'admin, non. C'est eux que ce dump protège.
  ```bash
  pg_dump "postgresql://mif_user:***@localhost:5432/madeinfrance" \
    -Fc -f ~/backups/mif-$(date +%Y%m%d).dump
  ```
- [ ] **T0.3** — Corriger `.gitignore` : remplacer `.env` par `.env*` + `!.env.example`. Vérifier avec `git status` que plus aucun `.env.local` n'apparaît.
- [ ] **T0.4** — Supprimer `index.ts:3569` (la ligne qui journalise la clé Stripe).
- [ ] **T0.5** — Neutraliser `GET /api/admin/ai/settings` (retirer `anthropicApiKey` et `openaiApiKey` de la réponse) et le `PUT` qui écrit `process.env` depuis le body.
- [ ] **T0.6** — Neutraliser `POST /api/admin/setup` (le commenter jusqu'à ce qu'il soit protégé).
- [ ] **T0.7** — **Régénérer tous les secrets exposés** : Stripe, Anthropic, OpenAI, `NEXTAUTH_SECRET`, identifiants Google OAuth.
- [ ] **T0.8** — Committer l'état actuel sur une branche `archive/janvier-2026` et la pousser. C'est le point de retour.
- [ ] **T0.9** — Repartir sur un `main` propre depuis cette archive.

**Critère de sortie**
```bash
git log --oneline | wc -l          # >= 2
git status --short | grep '\.env'  # aucune sortie
grep -rn "STRIPE_SECRET_KEY" apps/api/src/index.ts | grep console  # aucune sortie
ls ~/backups/mif-*.dump            # le dump existe
```

---

## Phase 1 — Périmètre et doublons · 1 jour

- [ ] **T1.1** — Écrire la spec v1 (une page maximum) à partir de la §3 : ce qui part, ce qui ne part pas.
- [ ] **T1.2** — Supprimer `apps/web/src/app/espace-marque/` en entier.
- [ ] **T1.3** — Réduire `/entreprises` à une landing marketing (supprimer `entreprises/inscription` et `entreprises/revendiquer`, qui doublonnent `/studio/inscription` et `/studio/revendiquer`).
- [ ] **T1.4** — Supprimer `apps/api/src/index.ts.backup`, `apps/web/tsconfig.tsbuildinfo`, et les scripts ponctuels : `enrich-products-test.ts`, `enrich-raptor-test.ts`, `enrich-raptor-save.ts`, `test-woocommerce.ts`, `enrich-20-brands.ts`.
- [ ] **T1.5** — Copier `CLAUDE.md` à la racine (ce fichier a déjà été écrit — vérifier qu'il correspond toujours au code).
- [ ] **T1.6** — Réécrire `README.md` à partir du code réel. Supprimer NestJS, FastAPI, Meilisearch, le service IA Python.
- [ ] **T1.7** — Archiver `PLAN.md` en `docs/archive/PLAN-janvier-2026.md` (valeur historique) et le retirer de la racine pour qu'aucune IA ne le lise comme une source.

**Critère de sortie** : `grep -rn "espace-marque" apps/` ne renvoie rien ; un seul chemin existe pour chaque fonctionnalité.

---

## Phase 2 — Base reproductible · 1 jour

- [ ] **T2.1** — Fixer et documenter la version de Node (`.nvmrc`) et de pnpm (`packageManager` est déjà à `pnpm@9.1.0`).
- [ ] **T2.2** — Réinstaller depuis le lockfile à neuf : `rm -rf node_modules && pnpm install --frozen-lockfile`.
- [ ] **T2.3** — Ajouter `@prisma/client` et `@mif/database` aux dépendances explicites de `apps/web` (aujourd'hui utilisés par remontée implicite).
- [ ] **T2.4** — Repartir d'une migration `init` unique alignée sur le `schema.prisma` actuel (baseline), testée sur une **copie** de la base, jamais sur l'originale.
- [ ] **T2.5** — Interdire `prisma db push` pour la suite du projet. Uniquement `prisma migrate`.
- [ ] **T2.6** — Basculer sur `docker-compose.yml` pour Postgres. Retirer `redis`, `meilisearch`, `minio` du compose de développement (services jamais utilisés).
- [ ] **T2.7** — Unifier les 5 `.env` : un `.env` racine pour la base et les services, un `.env.local` web pour NextAuth. Mettre à jour `.env.example` avec toutes les clés et aucune valeur.
- [ ] **T2.8** — Écrire un seed produisant une base de dev utilisable (~50 marques, ~2 000 produits — pas le catalogue entier) en une commande.
- [ ] **T2.9** — Ajouter les index manquants : `slug`, `status`, `brand_id`, et index GIN trigram sur `products.name` et `brands.name`.
- [ ] **T2.10** — Une commande unique `pnpm setup` : base, génération Prisma, migration, seed.

**Critère de sortie** : sur une machine vierge, `git clone` → `pnpm install` → `docker compose up -d` → `pnpm setup` → `pnpm dev` affiche des marques, sans aucune étape manuelle implicite.

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
|  |  |  |
