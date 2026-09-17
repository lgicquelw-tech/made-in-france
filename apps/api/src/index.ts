import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

import { logger } from './logger';
import bcrypt from 'bcryptjs';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';

// Version d'API Stripe figee en UN seul endroit (REBUILD.md T3.18). Elle etait
// repetee a trois instanciations, sous une valeur de decembre 2024 que le SDK
// installe (stripe v20) n'accepte plus.
const STRIPE_API_VERSION = '2025-12-15.clover' as const;
const stripeClient = () =>
  new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/stripe/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// ===========================================
// LIMITATION DE DÉBIT (REBUILD.md T3.21)
// ===========================================
// Il n'y en avait aucune. Trois routes en avaient un besoin immédiat :
//  - /chat appelle un modèle payant à chaque requête, sans authentification :
//    n'importe qui pouvait épuiser le budget Anthropic du projet ;
//  - les recherches déclenchent des requêtes trigram coûteuses ;
//  - le reste protège simplement la base d'un martèlement.
//
// Stockage en mémoire : suffisant pour un processus unique, mais il ne
// résistera pas à plusieurs instances. À remplacer par un compteur partagé le
// jour où l'API est déployée sur plus d'une machine (phase 7).

const limiterGeneral = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
});

const limiterRecherche = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Trop de recherches. Réessayez dans une minute.' },
});

// Le plus strict : chaque appel coûte de l'argent.
const limiterChat = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: "Vous avez atteint la limite de messages. Patientez une minute avant de continuer.",
  },
});

// Le webhook Stripe est appelé par Stripe, pas par un navigateur : le limiter
// ferait perdre des événements de paiement.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/stripe/webhook') return next();
  return limiterGeneral(req, res, next);
});
app.use('/api/v1/search', limiterRecherche);
app.use('/api/v1/brands/search', limiterRecherche);
app.use('/api/v1/chat', limiterChat);


function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
}

// ===========================================
// ADMIN PRODUCTS
// ===========================================


// ===========================================
// PUBLIC PRODUCTS API
// ===========================================

// ===========================================
// CREATE ADMIN USER (à exécuter une seule fois)
// ===========================================
// DESACTIVE — REBUILD.md T0.6.
// Cette route creait un compte super_admin sans aucune authentification ;
// le seul garde-fou etait « un admin existe deja ». A remplacer par une
// commande CLI protegee en phase 3 (T3.15).

// ===========================================
// CHAT API - Assistant IA Made in France avec Tool Use
// ===========================================

const chatTools: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description: 'Recherche des produits Made in France dans la base de données. Utilise cet outil quand l\'utilisateur cherche des produits, des idées cadeaux, ou veut acheter quelque chose.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Mots-clés de recherche (ex: "pull laine", "chaussures cuir", "chocolat")'
        },
        sector: {
          type: 'string',
          enum: ['Mode & Accessoires', 'Gastronomie', 'Beauté & Bien-être', 'Maison & Jardin', 'Sport & Loisirs', 'Enfants & Famille', 'High-Tech', 'Artisanat'],
          description: 'Secteur/catégorie de produits'
        },
        max_price: {
          type: 'number',
          description: 'Prix maximum en euros'
        },
        min_price: {
          type: 'number',
          description: 'Prix minimum en euros'
        },
        target: {
          type: 'string',
          enum: ['homme', 'femme', 'enfant', 'mixte'],
          description: 'Public cible du produit'
        },
        limit: {
          type: 'number',
          description: 'Nombre de résultats (défaut: 8, max: 12)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_brands',
    description: 'Recherche des marques françaises dans la base de données. Utilise cet outil quand l\'utilisateur cherche des marques, des fabricants, ou veut découvrir des entreprises françaises.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Mots-clés de recherche (ex: "pull", "chocolatier", "cosmétique bio")'
        },
        sector: {
          type: 'string',
          enum: ['Mode & Accessoires', 'Gastronomie', 'Beauté & Bien-être', 'Maison & Jardin', 'Sport & Loisirs', 'Enfants & Famille', 'High-Tech', 'Artisanat'],
          description: 'Secteur d\'activité de la marque'
        },
        region: {
          type: 'string',
          description: 'Région française (ex: "Bretagne", "Normandie")'
        },
        limit: {
          type: 'number',
          description: 'Nombre de résultats (défaut: 6, max: 12)'
        }
      },
      required: ['query']
    }
  }
];

// Fonction pour exécuter la recherche de produits
async function executeSearchProducts(params: {
  query: string;
  sector?: string;
  max_price?: number;
  min_price?: number;
  target?: string;
  limit?: number;
}) {
  // ⚠️ CONSTAT N°4 — INJECTION SQL, CHEMIN PUBLIC.
  // Cette fonction construisait sa requête par concaténation de chaînes
  // (`p.name ILIKE '%${k}%'`) avant de la passer à `$queryRawUnsafe`. Ses
  // paramètres viennent des arguments d'outil produits par le modèle, donc
  // en dernier ressort de ce que l'utilisateur écrit dans le chat : une
  // apostrophe suffisait à sortir de la chaîne.
  // Tout passe désormais par `Prisma.sql`, où chaque `${...}` devient un
  // paramètre lié — la valeur ne peut plus être interprétée comme du SQL.
  const limit = Math.min(params.limit || 32, 40);

  // Certains libellés de secteur arrivent encodés en HTML depuis le modèle.
  const sector = params.sector?.replace(/&amp;/g, '&');

  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.status = 'ACTIVE'`,
    Prisma.sql`p.price_min > 0`,
    Prisma.sql`p.price_min IS NOT NULL`,
    Prisma.sql`p.image_url IS NOT NULL`,
  ];

  if (params.max_price) conditions.push(Prisma.sql`p.price_min <= ${params.max_price}`);
  if (params.min_price) conditions.push(Prisma.sql`p.price_min >= ${params.min_price}`);
  if (sector) conditions.push(Prisma.sql`s.name = ${sector}`);
  if (params.target) {
    conditions.push(Prisma.sql`(
      p.attributes->>'target' = ${params.target}
      OR p.attributes->>'target' = 'mixte'
      OR p.attributes->>'target' IS NULL
    )`);
  }

  const keywords = (params.query || '').toLowerCase().split(/\s+/).filter(k => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map(k => {
      const like = `%${k}%`;
      return Prisma.sql`(
        p.name ILIKE ${like}
        OR p.tags::text ILIKE ${like}
        OR p.materials::text ILIKE ${like}
        OR p.description_short ILIKE ${like}
        OR b.name ILIKE ${like}
      )`;
    });
    conditions.push(Prisma.sql`(${Prisma.join(keywordConditions, ' AND ')})`);
  }

  const where = Prisma.join(conditions, ' AND ');

  try {
    // Diversification : au plus 3 produits par marque, puis mélange.
    const products = await prisma.$queryRaw<any[]>`
      WITH ranked_products AS (
        SELECT
          p.id, p.name, p.slug, p.description_short, p.image_url,
          p.price_min, p.price_max, p.external_buy_url,
          b.id as brand_id, b.name as brand_name, b.slug as brand_slug, b.city as brand_city,
          s.name as sector_name, s.color as sector_color,
          ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY RANDOM()) as brand_rank
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sectors s ON b.sector_id = s.id
        WHERE ${where}
      )
      SELECT id, name, slug, description_short, image_url, price_min, price_max,
             external_buy_url, brand_name, brand_slug, brand_city, sector_name, sector_color
      FROM ranked_products
      WHERE brand_rank <= 3
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    return products;
  } catch (e) {
    logger.error({ err: e }, 'Search products error:');
    return [];
  }
}

// Fonction pour exécuter la recherche de marques
async function executeSearchBrands(params: {
  query: string;
  sector?: string;
  region?: string;
  limit?: number;
}) {
  // Même correction que pour la recherche de produits : concaténation de
  // chaînes remplacée par des paramètres liés (constat n°4).
  const limit = Math.min(params.limit || 8, 12);
  const sector = params.sector?.replace(/&amp;/g, '&');

  const conditions: Prisma.Sql[] = [Prisma.sql`b.status = 'ACTIVE'`];

  if (sector) conditions.push(Prisma.sql`s.name = ${sector}`);
  if (params.region) conditions.push(Prisma.sql`r.name ILIKE ${`%${params.region}%`}`);

  const keywords = (params.query || '').toLowerCase().split(/\s+/).filter(k => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map(k => {
      const like = `%${k}%`;
      return Prisma.sql`(
        b.name ILIKE ${like}
        OR b.description_short ILIKE ${like}
        OR s.name ILIKE ${like}
        OR (b.ai_generated_content->>'tags')::text ILIKE ${like}
      )`;
    });
    conditions.push(Prisma.sql`(${Prisma.join(keywordConditions, ' OR ')})`);
  }

  const where = Prisma.join(conditions, ' AND ');
  const firstKeyword = `%${keywords[0] ?? ''}%`;

  try {
    const brands = await prisma.$queryRaw<any[]>`
      SELECT
        b.id, b.name, b.slug, b.description_short, b.logo_url, b.city,
        b.website_url, b.year_founded,
        s.name as sector_name, s.color as sector_color,
        r.name as region_name,
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE') as product_count
      FROM brands b
      LEFT JOIN sectors s ON b.sector_id = s.id
      LEFT JOIN regions r ON b.region_id = r.id
      WHERE ${where}
      ORDER BY
        CASE WHEN b.name ILIKE ${firstKeyword} THEN 0 ELSE 1 END,
        b.name ASC
      LIMIT ${limit}
    `;
    // Le journal qui déversait le détail de chaque marque trouvée a été
    // retiré : il polluait la sortie sans rien apprendre.
    return brands;
  } catch (e) {
    logger.error({ err: e }, 'Search brands error:');
    return [];
  }
}

const CHAT_SYSTEM_PROMPT = `Tu es un personal shopper Made in France 🇫🇷

RÈGLE ABSOLUE : À CHAQUE MESSAGE, tu DOIS appeler au moins un outil de recherche.
- Si l'utilisateur cherche des PRODUITS → appelle search_products
- Si l'utilisateur cherche des MARQUES/ENTREPRISES → appelle search_brands
- Si c'est ambigu → appelle LES DEUX pour montrer produits ET marques

QUAND UTILISER search_brands :
- "marques de pull", "entreprises françaises", "qui fabrique des...", "découvrir des marques"
- "marques bretonnes", "fabricants de...", "artisans qui font..."

QUAND UTILISER search_products :
- "je cherche un pull", "cadeau pour...", "produit moins de 50€"

QUAND UTILISER LES DEUX :
- "je cherche des pulls" → search_products(query="pull") + search_brands(query="pull", sector="Mode & Accessoires")
- Ça permet de montrer des produits ET les marques qui les fabriquent

Base de données : 902 marques françaises, ~40 000 produits
Secteurs : Mode & Accessoires, Gastronomie, Beauté & Bien-être, Maison & Jardin, Sport & Loisirs, Enfants & Famille, High-Tech, Artisanat

PROCESSUS À CHAQUE MESSAGE :
1. APPELLE le(s) bon(s) outil(s) avec limit=12
2. Présente les résultats en 1-2 phrases
3. Pose UNE question pour affiner
4. Propose 4 suggestions (critères, JAMAIS des noms de produits/marques)

SUGGESTIONS = CRITÈRES D'AFFINAGE :
- Pour QUI : "Pour homme|Pour femme|Pour enfant|C'est un cadeau"
- BUDGET : "Moins de 50€|Entre 50 et 100€|Plus de 100€|Peu importe"
- STYLE : "Style classique|Style moderne|En laine|En coton"
- DÉCOUVERTE : "Voir les marques|Produits artisanaux|Made in Bretagne|Nouveautés"

FORMAT DE FIN OBLIGATOIRE :
[SUGGESTIONS]
critère1|critère2|critère3|critère4
[/SUGGESTIONS]

STYLE : Tutoiement, 1-2 phrases max, emojis avec parcimonie (🇫🇷 ✨).

INTERDIT : Inventer des produits/marques ou proposer des noms en suggestion.`;

app.post('/api/v1/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis' });
    }


    // Charger les settings IA depuis la BDD
    let aiSettings: any = null;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'ai_settings' }
      });
      if (setting) {
        aiSettings = setting.value as any;
      }
    } catch {
      // Pas de reglage en base : on retombe sur les valeurs par defaut ci-dessous.
    }

    // Utiliser les settings ou les valeurs par défaut
    const model = aiSettings?.model || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
    const systemPrompt = aiSettings?.prompt || CHAT_SYSTEM_PROMPT;
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.maxTokens || 1024;
    const rules = aiSettings?.rules || [];

    // Vérifier les règles personnalisées
    const lowerMessage = message.toLowerCase();
    for (const rule of rules) {
      if (rule.enabled && lowerMessage.includes(rule.keyword.toLowerCase())) {
        return res.json({
          message: rule.response,
          products: [],
          brands: []
        });
      }
    }

    // Déterminer le provider (Anthropic ou OpenAI)
    const isOpenAI = model.startsWith('gpt-');

    if (isOpenAI) {
      // Utiliser OpenAI
      // Uniquement l'environnement du serveur (CLAUDE.md, regle 4). La
      // lecture d'une cle depuis les reglages en base a ete retiree : c'est
      // ce chemin qui rendait tentant d'en stocker une.
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(400).json({ error: 'Clé OpenAI non configurée' });
      }

      // TODO: Implémenter OpenAI avec tool use
      return res.status(400).json({ error: 'OpenAI pas encore implémenté avec tool use. Utilisez Claude.' });
    }

    // Utiliser Anthropic (Claude)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return res.status(400).json({ error: 'Clé Anthropic non configurée' });
    }

    // Créer un client Anthropic avec la bonne clé
    const anthropicClient = new Anthropic({ apiKey: anthropicKey });

    // Construire les messages pour Claude
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Premier appel à Claude avec les outils
    let response = await anthropicClient.messages.create({
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: chatTools,
      messages,
    });

    logger.debug({ stopReason: response.stop_reason, model }, 'reponse du modele');

    let relevantProducts: any[] = [];
    let relevantBrands: any[] = [];

    // Boucle pour gérer les appels d'outils
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) break;
        logger.debug({ tool: toolUseBlock.name }, 'appel d outil');

      let toolResult: any;

      if (toolUseBlock.name === 'search_products') {
        const products = await executeSearchProducts(toolUseBlock.input as any);
        relevantProducts = products;
        toolResult = products.length > 0
          ? `Trouvé ${products.length} produits: ${products.map((p: any) => `${p.name} (${p.brand_name}) - ${p.price_min}€`).join(', ')}`
          : 'Aucun produit trouvé';
      } else if (toolUseBlock.name === 'search_brands') {
        const brands = await executeSearchBrands(toolUseBlock.input as any);
        relevantBrands = brands;
        toolResult = brands.length > 0
          ? `Trouvé ${brands.length} marques: ${brands.map((b: any) => `${b.name} (${b.sector_name || 'N/A'})`).join(', ')}`
          : 'Aucune marque trouvée';
      } else {
        toolResult = 'Outil inconnu';
      }

      // Ajouter le résultat de l'outil et continuer
      messages.push({
        role: 'assistant',
        content: response.content,
      });
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });

      response = await anthropicClient.messages.create({
        model: model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: chatTools,
        messages,
      });
    }

    // Extraire la réponse finale
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    const finalMessage = textBlock?.text || 'Je n\'ai pas pu générer de réponse.';

    // Formater les résultats pour le frontend
    const formattedProducts = relevantProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description_short,
      imageUrl: p.image_url,
      priceMin: p.price_min,
      priceMax: p.price_max,
      buyUrl: p.external_buy_url,
      brandName: p.brand_name,
      brandSlug: p.brand_slug,
      brandCity: p.brand_city,
      sectorName: p.sector_name,
      sectorColor: p.sector_color,
    }));

    const formattedBrands = relevantBrands.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description_short,
      logoUrl: b.logo_url,
      websiteUrl: b.website_url,
      city: b.city,
      yearFounded: b.year_founded,
      sectorName: b.sector_name,
      sectorColor: b.sector_color,
      regionName: b.region_name,
      productCount: Number(b.product_count) || 0,
    }));


    res.json({
      message: finalMessage,
      products: formattedProducts,
      brands: formattedBrands,
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Chat error:');
    res.status(500).json({ error: 'Erreur du chat IA' });
  }
});

// ===========================================
// ESPACE MARQUE - DASHBOARD B2B
// ===========================================


// ===========================================
// AUTHENTIFICATION - INSCRIPTION
// ===========================================


// ===========================================
// LABELS API
// ===========================================

// ===========================================
// ADMIN LABELS API (Superadmin)
// ===========================================


// ===========================================
// ADMIN BRAND LABELS API (sans vérification tier)
// ===========================================


// ===========================================
// PRODUCT LABELS API
// ===========================================

// ===========================================
// STRIPE PAYMENTS
// ===========================================
// (l'import de Stripe est en tete de fichier — il etait duplique ici, ce qui
//  empechait le fichier de compiler : REBUILD.md T3.18)


// Webhook Stripe pour gérer les événements
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = stripeClient();
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // ⚠️ Le repli `JSON.parse(req.body)` quand le secret manquait acceptait
  // N'IMPORTE QUEL evenement non signe. Cette route met a jour
  // subscriptionTier : une requete forgee suffisait a s'octroyer un
  // abonnement Royale sur n'importe quelle marque. Un webhook non verifiable
  // doit echouer, jamais etre cru sur parole.
  if (!webhookSecret) {
    logger.error('[stripe] STRIPE_WEBHOOK_SECRET absent : webhook refuse.');
    return res.status(500).send('Webhook non configure');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ err: err.message }, '[stripe] signature du webhook invalide:');
    return res.status(400).send('Signature invalide');
  }

  // Gérer les événements
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { brandId, plan } = session.metadata || {};

      if (brandId && plan) {
        await prisma.brand.update({
          where: { id: brandId },
          data: {
            subscriptionTier: plan as 'PREMIUM' | 'ROYALE',
            stripeSubscriptionId: session.subscription as string,
          },
        });
        logger.info({ brandId, plan }, 'abonnement active');
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const brand = await prisma.brand.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (brand) {
        const isActive = subscription.status === 'active';
        if (!isActive) {
          await prisma.brand.update({
            where: { id: brand.id },
            data: { subscriptionTier: 'FREE' },
          });
          logger.info({ brandId: brand.id }, 'abonnement inactif, retour au palier gratuit');
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const brand = await prisma.brand.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (brand) {
        await prisma.brand.update({
          where: { id: brand.id },
          data: {
            subscriptionTier: 'FREE',
            stripeSubscriptionId: null,
          },
        });
        logger.info({ brandId: brand.id }, 'abonnement resilie, retour au palier gratuit');
      }
      break;
    }
  }

  res.json({ received: true });
});


// ===========================================
// CLOUDINARY UPLOAD
// ===========================================


// ===========================================
// START SERVER
// ===========================================
// ===========================================
// GESTIONNAIRE D'ERREURS CENTRALISÉ (REBUILD.md T3.22)
// ===========================================
// Il n'y en avait aucun. Chaque route renvoyait ses propres erreurs, et
// plusieurs incluaient `details: String(error)` — donc le message d'exception
// Prisma, avec le nom des tables et des colonnes, directement au client.
// Ici : le détail est journalisé côté serveur, le client reçoit une 500 nue.
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, 'erreur non geree');
  if (res.headersSent) return;
  res.status(500).json({ error: 'Erreur serveur' });
});

// Toute route inconnue : une 404 en JSON, pas la page HTML d'Express.
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route inconnue' });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API demarree');
});