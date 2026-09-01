> ## ⚠️ DOCUMENT D'ARCHIVE — NE PAS UTILISER COMME SOURCE
>
> Archivé le 1er septembre 2026. Il décrit une architecture qui n'a jamais existé :
> un backend NestJS, un service IA Python/FastAPI, Meilisearch, Redis et MinIO.
> Le backend réel est un fichier Express, la recherche utilise `pg_trgm`, et
> Redis / Meilisearch / MinIO ont été retirés du `docker-compose.yml` faute d'usage.
>
> Pour démarrer le projet, voir le [`README.md`](../../README.md) à la racine.

---

# 🚀 Guide de Démarrage Rapide - Made in France

## Ce qui a été créé

### Structure du Monorepo

```
made-in-france/
├── apps/
│   └── web/                      # ✅ Frontend Next.js (structure créée)
│       ├── src/
│       │   ├── app/              # Pages (layout, home)
│       │   ├── components/       # Composants React
│       │   │   ├── home/         # Hero, Inspiration, Featured, Map, Sectors
│       │   │   ├── layout/       # Header, Footer
│       │   │   └── ui/           # Button, Toast
│       │   ├── hooks/            # useToast
│       │   ├── lib/              # utils, api client
│       │   └── styles/           # globals.css
│       ├── tailwind.config.ts
│       └── next.config.js
│
├── packages/
│   ├── database/                 # ✅ Schéma Prisma complet
│   │   └── prisma/
│   │       ├── schema.prisma     # ~500 lignes, toutes les tables
│   │       └── seed.ts           # Données initiales (régions, secteurs, etc.)
│   │
│   └── shared/                   # ✅ Types & constantes partagés
│       └── src/
│           ├── types/            # Tous les types TypeScript
│           ├── constants/        # Constantes (couleurs, routes, etc.)
│           └── utils/            # Fonctions utilitaires
│
├── scripts/
│   ├── init-db.sql              # Extensions PostgreSQL
│   └── import/
│       └── import-brands.ts      # ✅ Script d'import Excel/CSV
│
├── docker-compose.yml           # ✅ PostgreSQL, Redis, Meilisearch, MinIO
├── .env.example                 # ✅ Variables d'environnement
└── turbo.json                   # ✅ Config Turbo monorepo
```

## Prochaines Étapes

### 1. Initialiser le projet (5 min)

```bash
# Cloner ou copier les fichiers
cd made-in-france

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec tes clés API
```

### 2. Lancer l'infrastructure (5 min)

```bash
# Démarrer PostgreSQL, Redis, Meilisearch
docker-compose up -d

# Vérifier que tout tourne
docker-compose ps
```

### 3. Initialiser la base de données (2 min)

```bash
# Générer le client Prisma
pnpm db:generate

# Appliquer les migrations
pnpm db:migrate

# Peupler avec les données initiales
pnpm db:seed

# (Optionnel) Voir les données dans Prisma Studio
pnpm db:studio
```

### 4. Importer tes marques depuis Excel (5 min)

```bash
# Prévisualiser l'import (dry run)
pnpm --filter @mif/scripts import:brands:dry ton-fichier.xlsx

# Importer réellement
pnpm --filter @mif/scripts import:brands ton-fichier.xlsx
```

### 5. Lancer le développement

```bash
# Lancer tous les services
pnpm dev

# Ou juste le frontend
pnpm --filter @mif/web dev
```

## Ce qu'il reste à créer

### Backend API (NestJS) - Priorité 1
- [ ] Structure NestJS
- [ ] Modules: Brands, Products, Search, Auth, Events
- [ ] Intégration Meilisearch
- [ ] Endpoints REST

### Service IA (FastAPI) - Priorité 2
- [ ] Service Python/FastAPI
- [ ] Query parsing
- [ ] Génération de descriptions
- [ ] Conversation assistant

### Frontend - Compléter - Priorité 1
- [ ] Page recherche avec filtres
- [ ] Page marque détaillée
- [ ] Page carte interactive (Mapbox)
- [ ] Pages secteurs/régions
- [ ] Authentification (NextAuth)
- [ ] Dashboard marque

### Fonctionnalités avancées - Priorité 3
- [ ] Paiements Stripe
- [ ] Analytics
- [ ] Campagnes sponsorisées

## Mapping de ton Excel

Ton fichier Excel devrait avoir des colonnes comme :

| Colonne attendue | Alternatives acceptées |
|-----------------|------------------------|
| Nom | Entreprise, Marque, Société |
| Site web | Site, URL, Site internet |
| Secteur | Activité, Domaine |
| Région | Region |
| Ville | Localisation |
| Description | Présentation, À propos |
| Instagram | Insta |
| Labels | Certifications |

Le script gère automatiquement les variations de noms de colonnes !

## URLs en développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API (quand créée) | http://localhost:4000 |
| Service IA (quand créé) | http://localhost:8000 |
| Meilisearch | http://localhost:7700 |
| Prisma Studio | http://localhost:5555 |
| MinIO Console | http://localhost:9001 |
| MailHog | http://localhost:8025 |

## Commandes utiles

```bash
# Développement
pnpm dev              # Lance tout
pnpm build            # Build production
pnpm lint             # Lint

# Base de données
pnpm db:migrate       # Migrations
pnpm db:seed          # Seed
pnpm db:studio        # Interface visuelle

# Import
pnpm --filter @mif/scripts import:brands fichier.xlsx

# Docker
docker-compose up -d          # Démarrer
docker-compose down           # Arrêter
docker-compose logs -f        # Logs
```

## Questions fréquentes

**Q: Comment ajouter une nouvelle région/secteur/label ?**
R: Modifie `packages/database/prisma/seed.ts` et relance `pnpm db:seed`

**Q: Comment personnaliser le mapping des colonnes Excel ?**
R: Édite `COLUMN_MAPPING` dans `scripts/import/import-brands.ts`

**Q: Comment changer les couleurs de l'interface ?**
R: Modifie `tailwind.config.ts` dans `apps/web/`

---

Besoin d'aide ? On continue à construire ensemble ! 🇫🇷
