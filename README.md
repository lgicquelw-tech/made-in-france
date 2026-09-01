# 🇫🇷 Made in France - Plateforme de Découverte

> L'assistant intelligent pour découvrir et acheter Made in France

## 📋 Vue d'ensemble

Cette plateforme est :
- Un **moteur de recherche intelligent** pour les marques et produits Made in France
- Un **assistant shopping conversationnel** propulsé par l'IA
- Une **carte interactive géolocalisée** des entreprises françaises
- Un **outil d'analytics** pour les marques et institutions
- Un **business model** générateur de revenus (affiliation, abonnements, data)

## 🏗️ Architecture

```
made-in-france/
├── apps/
│   ├── web/                 # Frontend Next.js (B2C + B2B)
│   ├── api/                 # Backend NestJS
│   └── ai-service/          # Service IA Python/FastAPI
├── packages/
│   ├── database/            # Prisma schema + migrations
│   ├── shared/              # Types TypeScript partagés
│   └── ui/                  # Composants UI partagés
├── scripts/
│   └── import/              # Scripts d'import de données
└── docs/                    # Documentation
```

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| AI Service | Python, FastAPI |
| Database | PostgreSQL + pgvector |
| Search | Meilisearch |
| Cache | Redis |
| Maps | Mapbox GL JS |
| Payments | Stripe |

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- pnpm 8+
- Python 3.11+
- PostgreSQL 16
- Redis
- Docker (optionnel)

### Installation

```bash
# Cloner le repo
git clone https://github.com/leptitstudio/made-in-france.git
cd made-in-france

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env

# Lancer la base de données (Docker)
docker-compose up -d postgres redis meilisearch

# Appliquer les migrations
pnpm db:migrate

# Importer les données initiales
pnpm db:seed

# Lancer en développement
pnpm dev
```

### URLs en développement

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **Meilisearch**: http://localhost:7700

## 📦 Scripts disponibles

```bash
pnpm dev          # Lance tous les services en dev
pnpm build        # Build de production
pnpm test         # Lance les tests
pnpm lint         # Lint du code
pnpm db:migrate   # Applique les migrations
pnpm db:seed      # Seed la base de données
pnpm db:studio    # Ouvre Prisma Studio
```

## 🔐 Variables d'environnement

Voir `.env.example` pour la liste complète. Variables essentielles :

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/madeinfrance

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=masterKey

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
```

## 📚 Documentation

- [Architecture détaillée](./docs/architecture.md)
- [Guide API](./docs/api.md)
- [Guide de contribution](./docs/contributing.md)
- [Déploiement](./docs/deployment.md)

## 📄 Licence

Propriétaire - © Le P'tit Studio 2025
