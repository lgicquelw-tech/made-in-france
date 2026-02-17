# 🇫🇷 Made in France - Plan du Projet

> Document de référence pour toutes les sessions de développement
> **Dernière mise à jour : 15 janvier 2026 - Post Session 18**

---

## 📋 Vision du Projet

**Made in France** est une plateforme de découverte des marques et produits fabriqués en France qui combine :

1. **Moteur de recherche intelligent** - Recherche par nom, région, secteur, label
2. **Assistant shopping conversationnel IA** - Interface principale pour recommandations personnalisées
3. **Carte interactive géolocalisée** - Visualisation des entreprises françaises
4. **Espace marque (B2B)** - Dashboard analytics et gestion pour les marques (MiF Studio)
5. **Modèle économique** - Affiliation, abonnements premium (Stripe), data

---

## 🏗️ Architecture Technique

### Stack
| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend API | Express.js |
| Base de données | PostgreSQL 16 + Prisma |
| Recherche | PostgreSQL trigram (pg_trgm) |
| Cartes | Mapbox GL JS |
| Logos | Google Favicons API (Clearbit déprécié) |
| Images | Cloudinary (upload, stockage, CDN) |
| Auth | NextAuth.js + Google OAuth |
| IA | OpenAI GPT-4o-mini |
| Éditeur texte riche | Tiptap |
| Paiements | Stripe (3 formules) ✨ NOUVEAU |

### Structure du Projet
```
~/Documents/made-in-france/
├── apps/
│   ├── web/                 # Frontend Next.js
│   │   └── src/
│   │       ├── app/         # Pages (App Router)
│   │       │   ├── admin/   # Back-office administration
│   │       │   │   ├── marques/
│   │       │   │   └── produits-tendances/
│   │       │   ├── studio/  # MiF Studio (B2B) ✨ NOUVEAU
│   │       │   │   ├── dashboard/
│   │       │   │   ├── marque/
│   │       │   │   ├── parametres/
│   │       │   │   └── produits/
│   │       │   ├── marques/[slug]/produits/
│   │       │   ├── produits/
│   │       │   ├── produits/[slug]/
│   │       │   ├── recherche/
│   │       │   └── api/     # API Routes (auth, uploads, stripe)
│   │       ├── components/  # Composants React
│   │       │   └── ui/      # Composants UI (rich-editor, icon-picker...)
│   │       ├── hooks/       # Custom hooks (useFavorites, etc.)
│   │       └── styles/      # CSS global
│   └── api/                 # Backend API (Express)
│       └── src/index.ts
├── packages/
│   └── database/            # Prisma schema
├── data/
│   └── brands.xlsx          # Données source
├── scripts/
│   ├── import/              # Scripts d'import
│   ├── seed-data.ts         # Seed régions/secteurs/labels
│   ├── populate-logos.ts    # Remplissage logos Cloudinary
│   ├── shopify-scraper.ts   # Scraper produits Shopify
│   ├── woocommerce-scraper.ts # Scraper WooCommerce
│   ├── update-buy-urls.ts   # MAJ URLs d'achat
│   ├── enrich-all-products.ts # Enrichissement IA produits
│   └── stats.ts             # Statistiques
└── docs/                    # Documentation
```

### URLs de développement
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Admin: http://localhost:3000/admin
- MiF Studio: http://localhost:3000/studio
- GitHub: https://github.com/lgicquelw-tech/made-in-france

---

## ✅ État Actuel (Post Session 18)

### Pages Implémentées

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Homepage | `/` | ✅ Mise à jour | Section "Produits du moment" cliquables |
| Marques | `/marques` | ✅ Complète | Liste avec favicons, couleurs secteurs, filtres, pagination |
| Fiche marque | `/marques/[slug]` | ✅ **Améliorée** | Galerie lightbox, vidéo YouTube, sections dynamiques |
| Catalogue marque | `/marques/[slug]/produits` | ✅ Complète | Tous les produits d'une marque avec tri/recherche |
| Produits | `/produits` | ✅ Complète | Catalogue global 40K produits avec filtres |
| Fiche produit | `/produits/[slug]` | ✅ Complète | Galerie images, prix, bouton achat direct |
| Recherche | `/recherche` | ✅ Complète | Recherche unifiée marques + produits |
| Secteurs | `/secteurs` | ✅ Complète | 9 secteurs avec compteurs et icônes |
| Secteur détail | `/secteurs/[slug]` | ✅ Complète | Marques par secteur |
| Régions | `/regions` | ✅ Complète | 13 régions avec compteurs |
| Région détail | `/regions/[slug]` | ✅ Complète | Marques par région |
| Carte | `/carte` | ✅ Complète | Mapbox + filtres secteur + popup avec favicon |
| À propos | `/a-propos` | ✅ Complète | Mission, labels, contact |
| Admin Dashboard | `/admin` | ✅ Complète | Tableau de bord + lien Tendances Produits |
| Admin Marques | `/admin/marques` | ✅ Complète | Liste + CRUD marques |
| Admin Éditeur | `/admin/marques/[id]` | ✅ Complète | Éditeur visuel avec sections dynamiques, tags IA |
| Admin Tendances | `/admin/produits-tendances` | ✅ Complète | Gérer les produits affichés en homepage |
| Profil | `/profil` | ✅ Complète | Page utilisateur avec favoris + accès admin |
| **MiF Studio** | `/studio` | ✅ **NOUVEAU** | Espace marques B2B |
| Studio Dashboard | `/studio/dashboard` | ✅ **NOUVEAU** | Stats, graphiques, activité |
| Studio Marque | `/studio/marque` | ✅ **NOUVEAU** | Édition infos, logo, photos, vidéo |
| Studio Paramètres | `/studio/parametres` | ✅ **NOUVEAU** | Abonnements Stripe (3 formules) |
| Studio Produits | `/studio/produits` | 🔄 À faire | Gestion produits par la marque |

### Systèmes Implémentés

#### 🔐 Authentification (Session 8)
- NextAuth.js configuré avec Google OAuth
- Schéma Prisma : User, Account, Session, VerificationToken
- Middleware de protection des routes `/admin`
- Accès admin via `/profil` pour utilisateurs autorisés

#### ⭐ Favoris & Gamification (Session 8)
- Système de favoris par utilisateur
- Points et niveaux (Explorer, Passionné, Expert, Ambassadeur)
- Hook `useFavorites` pour React
- API routes : `/api/favorites`, `/api/user/stats`

#### 🖼️ Gestion Images - Cloudinary (Sessions 13-14)
- Upload simple et multiple via API
- Suppression d'images
- Intégration dans l'éditeur admin et MiF Studio
- 900 logos auto-récupérés (via script)

#### 🛍️ Produits Shopify (Session 15)
- **21 814 produits importés** depuis 182 marques Shopify
- Script `shopify-scraper.ts` pour import automatique
- Affichage sur les fiches marques (9 produits max)
- Section "Produits du moment" sur la homepage
- Admin pour gérer les produits tendances (`isFeatured`)

#### 🛒 Produits WooCommerce (Session 16)
- **18 021 produits importés** depuis 204 marques WooCommerce
- Script `woocommerce-scraper.ts` pour import automatique
- Détection automatique des sites WooCommerce

#### 🔍 Recherche Unifiée (Session 16)
- Recherche marques + produits combinée
- Dropdown temps réel dans le header
- Page `/recherche` dédiée avec filtres
- Fuzzy search avec pg_trgm (tolère les fautes)

#### 🤖 Assistant IA Chat (Session 16 Suite)
- **API `/api/v1/chat`** avec OpenAI GPT-4o-mini
- Contexte dynamique (marques + produits de la base)
- Système de conversation avec historique
- Prompt système personnalisé Made in France
- Recommandations basées sur les données réelles

#### ✨ Enrichissement IA Produits (Session 17)
- Script `enrich-all-products.ts` avec GPT-4o-mini
- Traitement par batch de 20 marques
- Champs enrichis : tags, materials, benefits, target, priceRange, usage
- API recherche IA : `/api/v1/products/search/ai`
- Scoring par pertinence (tags 50pts, materials 30pts, name 40pts, description 20pts)

#### 📝 Éditeur Admin Amélioré (Session 17)
- **Éditeur de texte riche (Tiptap)**
- **Sections de contenu dynamiques** (titre, icône, contenu, visible/invisible)
- **Tags pour l'IA** (marques)

#### 🏢 MiF Studio - Espace Marques B2B (Sessions 18+) ✨ NOUVEAU
- **Dashboard** avec statistiques et graphiques
  - Vues, clics, favoris
  - Graphique d'évolution (30 derniers jours)
  - Activité récente
- **Page Marque** pour éditer les informations
  - Infos générales (nom, description, site web)
  - Logo avec upload Cloudinary
  - Galerie photos (upload multiple)
  - Vidéo YouTube
  - Réseaux sociaux
- **Page Paramètres** avec abonnements Stripe
  - 3 formules : Gratuit, Premium (29€/mois), Entreprise (99€/mois)
  - Intégration Stripe Checkout
  - Gestion du plan actuel

#### 🎬 Vidéo YouTube sur Page Marque (Session 18) ✨ NOUVEAU
- Extraction automatique de l'ID YouTube
- Thumbnail cliquable avec bouton play élégant
- Modal plein écran avec lecture automatique
- Style : cercle blanc + triangle couleur du secteur

#### 🖼️ Galerie Photos Améliorée (Session 18) ✨ NOUVEAU
- Affichage en grille responsive
- Lightbox avec navigation (précédent/suivant)
- Compteur de photos
- Fermeture par clic extérieur ou bouton X

### Données

- **902 marques** importées depuis Excel
- **872 marques géocodées** (coordonnées GPS)
- **39 835 produits actifs**
  - 21 814 depuis Shopify
  - 18 021 depuis WooCommerce
- **391 marques avec produits**
- **9 secteurs** avec couleurs distinctes
- **3 labels** : EPV, OFG, Artisan
- **13 régions** françaises
- **900 logos** en base (runtime = Google Favicons)

### Composants UI Créés

| Composant | Fichier | Description |
|-----------|---------|-------------|
| RichEditor | `components/ui/rich-editor.tsx` | Éditeur Tiptap avec toolbar complète |
| IconPicker | `components/ui/icon-picker.tsx` | Sélecteur d'icônes (40+ icônes) |
| SectionContent | `app/marques/[slug]/page.tsx` | Section avec "Voir plus/moins" |
| VideoSection | `app/marques/[slug]/page.tsx` | Lecteur YouTube avec modal ✨ NOUVEAU |
| GallerySection | `app/marques/[slug]/page.tsx` | Galerie photos avec lightbox ✨ NOUVEAU |

### API Endpoints Fonctionnels
```
# Marques
GET /api/v1/brands                         # Liste paginée
GET /api/v1/brands/featured                # Marques en vedette
GET /api/v1/brands/:slug                   # Détail marque (+ aiGeneratedContent)
GET /api/v1/brands/:slug/products          # Produits d'une marque
GET /api/v1/brands/with-coords-and-labels  # Pour la carte

# Produits
GET /api/v1/products                       # Liste avec filtres + fuzzy search
GET /api/v1/products/trending              # Produits tendances (homepage)
GET /api/v1/products/:slug                 # Détail produit
GET /api/v1/products/search/ai             # Recherche IA avec scoring
GET /api/admin/products/search             # Recherche produits (admin)
GET /api/admin/products/trending           # Liste produits tendances (admin)
PUT /api/admin/products/:id/toggle-featured # Toggle tendance

# Admin Marques
GET /api/admin/brands/:id                  # Détail marque admin
PUT /api/admin/brands/:id                  # Update marque (+ aiGeneratedContent)

# Recherche
GET /api/v1/search/all                     # Recherche unifiée marques + produits

# Chat IA
POST /api/v1/chat                          # Assistant conversationnel

# Référentiels
GET /api/v1/regions                        # Liste régions
GET /api/v1/regions/with-counts            # Régions avec compteurs
GET /api/v1/sectors                        # Liste secteurs
GET /api/v1/sectors/with-counts            # Secteurs avec compteurs
GET /api/v1/search?q=                      # Recherche floue (trigram)
GET /api/v1/stats                          # Statistiques

# Upload
POST /api/upload                           # Upload simple
POST /api/upload/multiple                  # Upload multiple
DELETE /api/upload                         # Suppression

# Auth
GET/POST /api/auth/[...nextauth]           # NextAuth endpoints

# Stripe ✨ NOUVEAU
POST /api/stripe/create-checkout           # Créer session Stripe
POST /api/stripe/webhook                   # Webhook Stripe
GET /api/stripe/portal                     # Portail client Stripe
```

---

## 🎯 Roadmap Mise à Jour

### Phase 1 - MVP ✅ TERMINÉE
- [x] Homepage IA-first avec recherche conversationnelle
- [x] Page marques avec filtres et couleurs secteurs
- [x] Pages détail marque avec favicons
- [x] Pages régions et secteurs
- [x] Carte interactive Mapbox avec couleurs par secteur
- [x] Import données Excel (900 marques)
- [x] Géocodage (872 marques)
- [x] SEO (meta, sitemap)
- [x] Recherche floue (PostgreSQL trigram)
- [x] Responsive mobile
- [x] Google Favicons partout

### Phase 1.5 - Administration ✅ TERMINÉE (Sessions 8-15)
- [x] Authentification NextAuth.js + Google OAuth
- [x] Système de favoris utilisateur
- [x] Gamification (points, niveaux)
- [x] Back-office admin complet
- [x] Éditeur visuel marques
- [x] Upload images Cloudinary
- [x] Gestion produits par marque
- [x] Migration Clearbit → Google Favicons

### Phase 1.6 - Produits Shopify ✅ TERMINÉE (Session 15)
- [x] Web scraping produits Shopify (21 814 produits)
- [x] Affichage produits sur fiches marques
- [x] Section "Produits du moment" homepage
- [x] Admin produits tendances

### Phase 1.7 - Améliorations Produits ✅ TERMINÉE (Session 16)
- [x] Fiche produit détaillée `/produits/[slug]`
- [x] Import WooCommerce (18 021 produits)
- [x] URLs d'achat directes
- [x] Page catalogue `/produits`
- [x] Recherche unifiée marques + produits
- [x] Recherche floue intelligente

### Phase 1.8 - Admin & IA Avancé ✅ TERMINÉE (Session 17)
- [x] Éditeur de texte riche (Tiptap)
- [x] Sections de contenu dynamiques
- [x] Tags IA pour marques
- [x] Enrichissement IA produits
- [x] API recherche IA avec scoring
- [x] Page marque améliorée (sections, galerie, réseaux sociaux)

### Phase 1.9 - MiF Studio & Améliorations ✅ TERMINÉE (Session 18)
- [x] **MiF Studio - Espace marques B2B**
  - Dashboard avec stats et graphiques
  - Page Marque (édition infos, logo, photos, vidéo)
  - Page Paramètres avec abonnements Stripe
- [x] **Vidéo YouTube sur page marque**
  - Modal plein écran
  - Bouton play élégant
- [x] **Galerie photos améliorée**
  - Lightbox avec navigation

### Phase 2 - IA & Recherche Avancée 🔄 EN COURS
- [x] **API Chat avec OpenAI GPT-4o-mini** ✅ FAIT
- [x] **Enrichissement IA produits** ✅ FAIT
- [x] **Tags IA marques** ✅ FAIT
- [ ] **Interface chat frontend**
  - Intégration dans la barre de recherche homepage
  - Mode conversation
  - Affichage des recommandations
- [ ] **Intégrer tags marques dans recherche IA**
- [ ] **Embeddings & recherche sémantique**
  - pgvector pour similarité vectorielle
  - "Trouve-moi une alternative à Nike"

### Phase 3 - B2B & Monétisation 🔄 EN COURS
- [x] **MiF Studio Dashboard** ✅ FAIT
- [x] **Abonnements Stripe** ✅ FAIT (3 formules)
- [ ] **Page Produits dans MiF Studio**
  - Liste des produits de la marque
  - Ajout/modification/suppression
- [ ] Analytics B2B avancés
- [ ] Campagnes sponsorisées
- [ ] Outils IA pour marques

### Phase 4 - Évolutions
- [ ] Application mobile
- [ ] Scan produit / alternative MiF
- [ ] Avis utilisateurs
- [ ] API publique
- [ ] Marketplace
- [ ] Déploiement production (Vercel + Railway)

---

## 🔑 Configuration

### Variables d'Environnement (.env)
```env
# Database
DATABASE_URL="postgresql://mif_user:mif_password@localhost:5432/madeinfrance?schema=public"

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# IA
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Stripe ✨ NOUVEAU
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Commandes Utiles
```bash
# Démarrer PostgreSQL (IMPORTANT - à faire avant pnpm dev)
brew services start postgresql@16

# Développement
cd ~/Documents/made-in-france
pnpm dev                    # Lance frontend + API

# Test API Chat
curl -X POST "http://localhost:4000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Je cherche des chaussures Made in France"}'

# Base de données
npx prisma studio --schema=./packages/database/prisma/schema.prisma
npx prisma db push --schema=./packages/database/prisma/schema.prisma

# Scrapers
npx tsx scripts/shopify-scraper.ts --all
npx tsx scripts/woocommerce-scraper.ts --all

# Enrichissement IA
npx tsx scripts/enrich-all-products.ts

# Statistiques
npx tsx scripts/stats.ts

# Générer client Prisma
cd packages/database && npx prisma generate

# Stripe CLI (pour tester webhooks)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 📝 Notes de Session

### Session 18 (15/01/2026) - MIF STUDIO & VIDÉO ✨
**Réalisations majeures :**

1. **MiF Studio - Espace marques B2B**
   - Dashboard avec stats (vues, clics, favoris)
   - Graphique d'évolution 30 jours
   - Page Marque (édition complète)
   - Page Paramètres avec Stripe

2. **Intégration Stripe**
   - 3 formules : Gratuit, Premium (29€), Entreprise (99€)
   - Stripe Checkout pour paiement
   - Gestion des abonnements

3. **Vidéo YouTube sur page marque**
   - Composant `VideoSection`
   - Extraction ID YouTube automatique
   - Modal plein écran avec autoplay
   - Bouton play : cercle blanc + triangle couleur secteur

4. **Galerie photos améliorée**
   - Composant `GallerySection`
   - Lightbox avec navigation
   - Compteur de photos

5. **Corrections**
   - Fix balises JSX mal fermées
   - Fix import `useParams` manquant

### Session 17 (10-11/01/2026) - ADMIN AVANCÉ & IA
- Éditeur de texte riche (Tiptap)
- Sections de contenu dynamiques
- Tags IA pour marques
- Enrichissement IA produits
- Page marque publique améliorée

### Sessions précédentes
- Session 16 Suite: API Chat OpenAI
- Session 16: Produits complet, recherche unifiée
- Session 15: Import Shopify 21K produits
- Sessions 11-14: Admin + Cloudinary
- Sessions 8-10: Auth + Favoris
- Sessions 1-7: MVP initial

---

## 🚨 Points d'Attention

1. **PostgreSQL** : Toujours lancer `brew services start postgresql@16` avant de développer
2. **Clearbit MORT** : Ne plus utiliser `logo.clearbit.com` - utiliser Google Favicons
3. **API Routes Express** : Les routes statiques DOIVENT être AVANT les routes dynamiques
4. **Tiptap SSR** : Ajouter `immediatelyRender: false` dans useEditor
5. **aiGeneratedContent** : Ajouter dans PUT /api/admin/brands/:id pour sauvegarder
6. **OpenAI** : Clé dans `apps/api/.env` (pas à la racine !)
7. **Balises JSX** : Vérifier que toutes les balises sont fermées (`<a>`, `</div>`, etc.)
8. **Stripe** : Clés dans `apps/web/.env.local` pour le frontend

---

## 🎯 Prochaines Étapes

### Interface Chat Frontend (Priorité 1)
1. Créer composant `ChatBot.tsx`
2. Intégrer dans la homepage (bulle en bas à droite)
3. Mode conversation avec historique
4. Affichage des recommandations cliquables

### MiF Studio - Page Produits (Priorité 2)
1. Liste des produits de la marque
2. Ajout manuel de produits
3. Modification/suppression
4. Synchronisation avec scraper

### Intégrer Tags Marques dans Recherche IA
1. Modifier l'API de recherche pour inclure les tags marques
2. Améliorer le scoring avec les tags

### Déploiement (Priorité 3)
1. Vercel pour le frontend
2. Railway pour l'API + PostgreSQL
3. Variables d'environnement en production

---

## 📊 Statistiques Projet

| Métrique | Valeur |
|----------|--------|
| Marques | 902 |
| Marques géocodées | 872 |
| Marques avec produits | 391 |
| **Produits actifs** | **39 835** |
| Produits Shopify | 21 814 |
| Produits WooCommerce | 18 021 |
| Secteurs | 9 |
| Régions | 13 |
| Labels | 3 |
| Composants UI custom | 5 |
| Pages MiF Studio | 4 |

---

## 📞 Contact Projet

**Louis Gicquel-Wallerand**  
Le P'tit Studio  
Projet Made in France

---

*Dernière mise à jour : 15 janvier 2026 - Post Session 18*
