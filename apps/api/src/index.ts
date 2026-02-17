import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';

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

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration Multer pour upload en mémoire
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===========================================
// STATS API
// ===========================================
app.get('/api/v1/stats', async (req, res) => {
  try {
    const brandsCount = await prisma.brand.count();
    const regionsCount = await prisma.region.count();
    const sectorsCount = await prisma.sector.count();

    res.json({
      data: {
        brands: brandsCount,
        regions: regionsCount,
        sectors: sectorsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// BRANDS API
// ===========================================
app.get('/api/v1/brands', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.region) {
      where.region = { slug: req.query.region };
    }

    if (req.query.sector) {
      where.sector = { slug: req.query.sector };
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          region: true,
          sector: true,
        },
      }),
      prisma.brand.count({ where }),
    ]);

    res.json({
      data: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        city: brand.city,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marques avec coordonnées (pour la carte)
app.get('/api/v1/brands/with-coords', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionShort: true,
        city: true,
        websiteUrl: true,
        latitude: true,
        longitude: true,
        region: {
          select: { name: true }
        },
      },
    });

    res.json({
      data: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        city: brand.city,
        region: brand.region?.name || null,
        websiteUrl: brand.websiteUrl,
        latitude: brand.latitude,
        longitude: brand.longitude,
      })),
      total: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands with coords:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marques avec coordonnées, labels ET secteur (pour la carte avec filtres)
app.get('/api/v1/brands/with-coords-and-labels', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        descriptionShort: true,
        city: true,
        websiteUrl: true,
        latitude: true,
        longitude: true,
        region: {
          select: { name: true }
        },
        sector: {
          select: { 
            name: true,
            slug: true,
            color: true 
          }
        },
        labels: {
          select: {
            label: {
              select: { name: true }
            }
          }
        },
      },
    });

    res.json({
      data: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        city: brand.city,
        region: brand.region?.name || null,
        websiteUrl: brand.websiteUrl,
        latitude: brand.latitude,
        longitude: brand.longitude,
        labels: brand.labels.map(l => l.label.name),
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || '#002395',
      })),
      total: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands with coords and labels:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marque aléatoire (pour "Surprends-moi")
app.get('/api/v1/brands/random', async (req, res) => {
  try {
    const count = await prisma.brand.count();
    const randomIndex = Math.floor(Math.random() * count);
    
    const brand = await prisma.brand.findFirst({
      skip: randomIndex,
      include: {
        region: true,
        sector: true,
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Aucune marque trouvée' });
    }

    res.json({
      data: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        city: brand.city,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || null,
      },
    });
  } catch (error) {
    console.error('Error fetching random brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marque de la semaine (depuis la table FeaturedBrand)
app.get('/api/v1/brands/weekly', async (req, res) => {
  try {
    const now = new Date();
    
    const featuredBrands = await prisma.featuredBrand.findMany({
      where: {
        isActive: true,
        featuredType: 'weekly',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        brand: {
          include: {
            region: true,
            sector: true,
            labels: {
              include: { label: true },
            },
          },
        },
      },
    });

    if (featuredBrands.length > 0) {
      const brands = featuredBrands.map(fb => ({
        id: fb.brand.id,
        name: fb.brand.name,
        slug: fb.brand.slug,
        description: fb.description || fb.brand.descriptionShort,
        story: fb.brand.story,
        logoUrl: fb.brand.logoUrl,
        websiteUrl: fb.brand.websiteUrl,
        city: fb.brand.city,
        yearFounded: fb.brand.yearFounded,
        region: fb.brand.region?.name || null,
        sector: fb.brand.sector?.name || null,
        sectorSlug: fb.brand.sector?.slug || null,
        sectorColor: fb.brand.sector?.color || null,
        labels: fb.brand.labels.map(l => l.label.name),
        imageUrl: fb.imageUrl,
        title: fb.title,
      }));

      return res.json({ data: brands, weekNumber: getWeekNumber() });
    }

    const weekNumber = getWeekNumber();
    const count = await prisma.brand.count();
    const index = (weekNumber * 7 + now.getFullYear()) % count;
    
    const brand = await prisma.brand.findFirst({
      skip: index,
      include: {
        region: true,
        sector: true,
        labels: {
          include: { label: true },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Aucune marque trouvée' });
    }

    res.json({
      data: [{
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        story: brand.story,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        city: brand.city,
        yearFounded: brand.yearFounded,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || null,
        labels: brand.labels.map(l => l.label.name),
      }],
      weekNumber,
    });
  } catch (error) {
    console.error('Error fetching weekly brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
}

// Marques en vedette
app.get('/api/v1/brands/featured', async (req, res) => {
  try {
    let brands = await prisma.brand.findMany({
      where: { isFeatured: true },
      take: 8,
      include: {
        region: true,
        sector: true,
      },
    });

    if (brands.length < 8) {
      brands = await prisma.brand.findMany({
        take: 8,
        orderBy: [
          { isFeatured: 'desc' },
          { isVerified: 'desc' },
          { name: 'asc' }
        ],
        include: {
          region: true,
          sector: true,
        },
      });
    }

    res.json({
      data: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        city: brand.city,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marques tendances
app.get('/api/v1/brands/trending', async (req, res) => {
  try {
    const now = new Date();
    
    const trendingBrands = await prisma.trendingBrand.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      take: 8,
      include: {
        brand: {
          include: {
            region: true,
            sector: true,
          },
        },
      },
    });

    if (trendingBrands.length > 0) {
      return res.json({
        data: trendingBrands.map(tb => ({
          id: tb.brand.id,
          name: tb.brand.name,
          slug: tb.brand.slug,
          description: tb.brand.descriptionShort,
          logoUrl: tb.brand.logoUrl,
          websiteUrl: tb.brand.websiteUrl,
          city: tb.brand.city,
          region: tb.brand.region?.name || null,
          sector: tb.brand.sector?.name || null,
          sectorSlug: tb.brand.sector?.slug || null,
          sectorColor: tb.brand.sector?.color || null,
          trendScore: tb.trendScore,
          reason: tb.reason,
        })),
      });
    }

    const brands = await prisma.brand.findMany({
      take: 4,
      orderBy: { name: 'asc' },
      include: {
        region: true,
        sector: true,
      },
    });

    res.json({
      data: brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        city: brand.city,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || null,
        trendScore: Math.floor(Math.random() * 20) + 5,
        reason: null,
      })),
    });
  } catch (error) {
    console.error('Error fetching trending brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Recherche de marques
app.get('/api/v1/brands/search', async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ data: [] });
    }

    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      include: {
        sector: true,
      },
      take: parseInt(limit as string),
      orderBy: { name: 'asc' },
    });

    res.json({
      data: brands.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        websiteUrl: b.websiteUrl,
        city: b.city,
        sector: b.sector ? { name: b.sector.name, color: b.sector.color } : null,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détail d'une marque
app.get('/api/v1/brands/:slug', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug },
      include: {
        region: true,
        sector: true,
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    res.json({ data: brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// COLLECTIONS API
// ===========================================
app.get('/api/v1/collections', async (req, res) => {
  try {
    const now = new Date();
    
    const collections = await prisma.collection.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { brands: true },
        },
      },
    });

    res.json({
      data: collections.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        color: c.color,
        brandCount: c._count.brands,
      })),
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/collections/:slug', async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { slug: req.params.slug },
      include: {
        brands: {
          orderBy: { displayOrder: 'asc' },
          include: {
            brand: {
              include: {
                region: true,
                sector: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection non trouvée' });
    }

    res.json({
      data: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        imageUrl: collection.imageUrl,
        color: collection.color,
        brands: collection.brands.map(cb => ({
          id: cb.brand.id,
          name: cb.brand.name,
          slug: cb.brand.slug,
          description: cb.brand.descriptionShort,
          logoUrl: cb.brand.logoUrl,
          websiteUrl: cb.brand.websiteUrl,
          city: cb.brand.city,
          region: cb.brand.region?.name || null,
          sector: cb.brand.sector?.name || null,
          sectorSlug: cb.brand.sector?.slug || null,
          sectorColor: cb.brand.sector?.color || null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// FAVORITES API
// ===========================================
app.get('/api/v1/users/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        brand: {
          include: {
            region: true,
            sector: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: favorites.map(fav => ({
        id: fav.id,
        brandId: fav.brandId,
        createdAt: fav.createdAt,
        brand: {
          id: fav.brand.id,
          name: fav.brand.name,
          slug: fav.brand.slug,
          description: fav.brand.descriptionShort,
          logoUrl: fav.brand.logoUrl,
          websiteUrl: fav.brand.websiteUrl,
          city: fav.brand.city,
          region: fav.brand.region?.name || null,
          sector: fav.brand.sector?.name || null,
          sectorSlug: fav.brand.sector?.slug || null,
          sectorColor: fav.brand.sector?.color || null,
        },
      })),
      total: favorites.length,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/users/:userId/favorites/:brandId', async (req, res) => {
  try {
    const { userId, brandId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_brandId: { userId, brandId },
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/v1/users/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'brandId requis' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_brandId: { userId, brandId },
      },
      update: {},
      create: {
        userId,
        brandId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 5 } },
    });

    res.json({ 
      data: favorite,
      message: 'Marque ajoutée aux favoris (+5 points)',
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/v1/users/:userId/favorites/:brandId', async (req, res) => {
  try {
    const { userId, brandId } = req.params;

    await prisma.favorite.delete({
      where: {
        userId_brandId: { userId, brandId },
      },
    });

    res.json({ message: 'Marque retirée des favoris' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// USER API
// ===========================================
app.get('/api/v1/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { favorites: true, brandViews: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        points: user.points,
        rank: user.rank,
        favoritesCount: user._count.favorites,
        viewsCount: user._count.brandViews,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/v1/users/:userId/views', async (req, res) => {
  try {
    const { userId } = req.params;
    const { brandId } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: 'brandId requis' });
    }

    await prisma.brandView.create({
      data: {
        userId,
        brandId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: 1 } },
    });

    res.json({ message: 'Vue enregistrée (+1 point)' });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// SEARCH API
// ===========================================
app.get('/api/v1/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    if (!query.trim()) {
      const [brands, total] = await Promise.all([
        prisma.brand.findMany({
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: { region: true, sector: true },
        }),
        prisma.brand.count(),
      ]);

      return res.json({
        data: brands.map(brand => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.descriptionShort,
          logoUrl: brand.logoUrl,
          websiteUrl: brand.websiteUrl,
          city: brand.city,
          region: brand.region?.name || null,
          sector: brand.sector?.name || null,
          sectorSlug: brand.sector?.slug || null,
          sectorColor: brand.sector?.color || null,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        query,
      });
    }

    const searchResults = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      description_short: string | null;
      logo_url: string | null;
      website_url: string | null;
      city: string | null;
      region_name: string | null;
      sector_name: string | null;
      sector_slug: string | null;
      sector_color: string | null;
      similarity: number;
    }>>`
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.description_short,
        b.logo_url,
        b.website_url,
        b.city,
        r.name as region_name,
        s.name as sector_name,
        s.slug as sector_slug,
        s.color as sector_color,
        GREATEST(
          similarity(b.name, ${query}),
          similarity(COALESCE(b.description_short, ''), ${query}),
          similarity(COALESCE(b.city, ''), ${query})
        ) as similarity
      FROM brands b
      LEFT JOIN regions r ON b.region_id = r.id
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE 
        b.name ILIKE ${'%' + query + '%'}
        OR b.description_short ILIKE ${'%' + query + '%'}
        OR b.city ILIKE ${'%' + query + '%'}
        OR similarity(b.name, ${query}) > 0.2
        OR similarity(COALESCE(b.description_short, ''), ${query}) > 0.2
      ORDER BY similarity DESC, b.name ASC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM brands b
      WHERE 
        b.name ILIKE ${'%' + query + '%'}
        OR b.description_short ILIKE ${'%' + query + '%'}
        OR b.city ILIKE ${'%' + query + '%'}
        OR similarity(b.name, ${query}) > 0.2
        OR similarity(COALESCE(b.description_short, ''), ${query}) > 0.2
    `;

    const total = Number(countResult[0]?.count || 0);

    res.json({
      data: searchResults.map(brand => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description_short,
        logoUrl: brand.logo_url,
        websiteUrl: brand.website_url,
        city: brand.city,
        region: brand.region_name,
        sector: brand.sector_name,
        sectorSlug: brand.sector_slug,
        sectorColor: brand.sector_color,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      query,
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// REFERENCE DATA API
// ===========================================
app.get('/api/v1/regions', async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ data: regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/regions/with-counts', async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { brands: true }
        }
      }
    });
    
    res.json({
      data: regions.map(region => ({
        id: region.id,
        name: region.name,
        slug: region.slug,
        brandCount: region._count.brands,
      }))
    });
  } catch (error) {
    console.error('Error fetching regions with counts:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/sectors', async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ data: sectors });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/sectors/with-counts', async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { brands: true }
        }
      }
    });
    
    res.json({
      data: sectors.map(sector => ({
        id: sector.id,
        name: sector.name,
        slug: sector.slug,
        color: sector.color,
        icon: sector.icon,
        brandCount: sector._count.brands,
      }))
    });
  } catch (error) {
    console.error('Error fetching sectors with counts:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// ADMIN API
// ===========================================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      brandsTotal,
      brandsThisMonth,
      productsTotal,
      productsFeatured,
      usersTotal,
      usersThisMonth,
      premiumCount,
      royaleCount,
    ] = await Promise.all([
      prisma.brand.count(),
      prisma.brand.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count(),
      prisma.product.count({ where: { isFeatured: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.brand.count({ where: { subscriptionTier: 'PREMIUM' } }),
      prisma.brand.count({ where: { subscriptionTier: 'ROYALE' } }),
    ]);

    const mrr = (premiumCount * 29) + (royaleCount * 99);
    const freeCount = brandsTotal - premiumCount - royaleCount;

    res.json({
      data: {
        brands: { total: brandsTotal, active: brandsTotal, pending: 0, thisMonth: brandsThisMonth },
        products: { total: productsTotal, active: productsTotal, featured: productsFeatured },
        users: { total: usersTotal, thisMonth: usersThisMonth, active: usersTotal },
        subscriptions: { free: freeCount, premium: premiumCount, royale: royaleCount, mrr },
        analytics: { pageViews: 0, clickOuts: 0, favorites: 0, searches: 0 },
        ai: { conversations: 0, tokensUsed: 0, cost: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// ADMIN BRANDS
// ===========================================
app.get('/api/admin/brands', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          region: true,
          sector: true,
        },
      }),
      prisma.brand.count({ where }),
    ]);

    res.json({
      data: brands,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/admin/brands/:id', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: req.params.id },
      include: {
        region: true,
        sector: true,
        labels: { include: { label: true } },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    res.json({ data: brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/admin/brands', async (req, res) => {
  try {
    const data = req.body;
    
    const slug = data.slug || data.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        story: data.story,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
        galleryUrls: data.galleryUrls || [],
        videoUrl: data.videoUrl,
        websiteUrl: data.websiteUrl,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        yearFounded: data.yearFounded ? parseInt(data.yearFounded) : null,
        email: data.email,
        phone: data.phone,
        sectorId: data.sectorId || null,
        regionId: data.regionId || null,
        socialLinks: data.socialLinks || {},
        aiGeneratedContent: data.aiGeneratedContent || {},
        status: data.status || 'ACTIVE',
        isFeatured: data.isFeatured || false,
        isVerified: data.isVerified || false,
      },
      include: {
        region: true,
        sector: true,
      },
    });

    res.json({ data: brand });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.put('/api/admin/brands/:id', async (req, res) => {
  try {
    const data = req.body;

    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        story: data.story,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
        galleryUrls: data.galleryUrls || [],
        videoUrl: data.videoUrl,
        websiteUrl: data.websiteUrl,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        yearFounded: data.yearFounded ? parseInt(data.yearFounded) : null,
        sectorId: data.sectorId || null,
        regionId: data.regionId || null,
        socialLinks: data.socialLinks || {},
        aiGeneratedContent: data.aiGeneratedContent || {},
        status: data.status,
        isFeatured: data.isFeatured,
        isVerified: data.isVerified,
      },
      include: {
        region: true,
        sector: true,
      },
    });

    res.json({ data: brand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/admin/brands/:id', async (req, res) => {
  try {
    await prisma.brand.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Marque supprimée' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// ADMIN COLLECTIONS
// ===========================================
app.get('/api/admin/collections', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { brands: true } },
      },
    });

    res.json({ data: collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/admin/collections', async (req, res) => {
  try {
    const data = req.body;
    
    const slug = data.slug || data.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        color: data.color,
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        displayOrder: data.displayOrder || 0,
      },
    });

    res.json({ data: collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.put('/api/admin/collections/:id', async (req, res) => {
  try {
    const data = req.body;

    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        color: data.color,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        displayOrder: data.displayOrder,
      },
    });

    res.json({ data: collection });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/admin/collections/:id', async (req, res) => {
  try {
    await prisma.collection.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Collection supprimée' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/admin/collections/:id/brands', async (req, res) => {
  try {
    const { brandIds } = req.body;

    await prisma.collectionBrand.createMany({
      data: brandIds.map((brandId: string, index: number) => ({
        collectionId: req.params.id,
        brandId,
        displayOrder: index,
      })),
      skipDuplicates: true,
    });

    res.json({ message: 'Marques ajoutées à la collection' });
  } catch (error) {
    console.error('Error adding brands to collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/admin/collections/:id/brands/:brandId', async (req, res) => {
  try {
    await prisma.collectionBrand.delete({
      where: {
        collectionId_brandId: {
          collectionId: req.params.id,
          brandId: req.params.brandId,
        },
      },
    });

    res.json({ message: 'Marque retirée de la collection' });
  } catch (error) {
    console.error('Error removing brand from collection:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// ADMIN FEATURED BRANDS
// ===========================================
app.get('/api/admin/featured', async (req, res) => {
  try {
    const featured = await prisma.featuredBrand.findMany({
      orderBy: [{ featuredType: 'asc' }, { displayOrder: 'asc' }],
      include: {
        brand: {
          include: {
            region: true,
            sector: true,
          },
        },
      },
    });

    res.json({ data: featured });
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/admin/featured', async (req, res) => {
  try {
    const data = req.body;

    const featured = await prisma.featuredBrand.create({
      data: {
        brandId: data.brandId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        featuredType: data.featuredType || 'weekly',
        isActive: data.isActive ?? true,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        displayOrder: data.displayOrder || 0,
      },
      include: {
        brand: true,
      },
    });

    res.json({ data: featured });
  } catch (error) {
    console.error('Error creating featured brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.put('/api/admin/featured/:id', async (req, res) => {
  try {
    const data = req.body;

    const featured = await prisma.featuredBrand.update({
      where: { id: req.params.id },
      data: {
        brandId: data.brandId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        featuredType: data.featuredType,
        isActive: data.isActive,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        displayOrder: data.displayOrder,
      },
      include: {
        brand: true,
      },
    });

    res.json({ data: featured });
  } catch (error) {
    console.error('Error updating featured brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/admin/featured/:id', async (req, res) => {
  try {
    await prisma.featuredBrand.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Marque en vedette supprimée' });
  } catch (error) {
    console.error('Error deleting featured brand:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// ADMIN PRODUCTS
// ===========================================

// Recherche produits (pour admin) - DOIT ÊTRE AVANT /:id
app.get('/api/admin/products/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query.trim()) {
      return res.json({ data: [] });
    }

    // Normaliser la requête (enlever accents)
    const normalizedQuery = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Recherche dans le nom du produit et de la marque avec tolérance aux fautes
    const products = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
      price_min: number | null;
      price_max: number | null;
      is_featured: boolean;
      status: string;
      brand_id: string;
      brand_name: string;
      brand_slug: string;
      sector_color: string | null;
      relevance: number;
    }>>`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.image_url,
        p.price_min,
        p.price_max,
        p.is_featured,
        p.status,
        b.id as brand_id,
        b.name as brand_name,
        b.slug as brand_slug,
        s.color as sector_color,
        CASE
          -- Correspondance exacte (priorité max)
          WHEN p.name ILIKE ${query} THEN 100
          WHEN p.name ILIKE ${normalizedQuery} THEN 100
          -- Commence par
          WHEN p.name ILIKE ${query + '%'} THEN 90
          WHEN p.name ILIKE ${normalizedQuery + '%'} THEN 90
          -- Contient
          WHEN p.name ILIKE ${'%' + query + '%'} THEN 80
          WHEN p.name ILIKE ${'%' + normalizedQuery + '%'} THEN 80
          -- Marque exacte
          WHEN b.name ILIKE ${query} THEN 70
          WHEN b.name ILIKE ${normalizedQuery} THEN 70
          -- Marque contient
          WHEN b.name ILIKE ${'%' + query + '%'} THEN 60
          WHEN b.name ILIKE ${'%' + normalizedQuery + '%'} THEN 60
          -- Fuzzy sur nom produit (tolérance fautes)
          WHEN similarity(p.name, ${query}) > 0.4 THEN similarity(p.name, ${query}) * 50
          WHEN similarity(p.name, ${normalizedQuery}) > 0.4 THEN similarity(p.name, ${normalizedQuery}) * 50
          -- Fuzzy sur marque
          WHEN similarity(b.name, ${query}) > 0.4 THEN similarity(b.name, ${query}) * 40
          WHEN similarity(b.name, ${normalizedQuery}) > 0.4 THEN similarity(b.name, ${normalizedQuery}) * 40
          ELSE 0
        END as relevance
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE 
        p.status = 'ACTIVE'
        AND (
          p.name ILIKE ${'%' + query + '%'}
          OR p.name ILIKE ${'%' + normalizedQuery + '%'}
          OR b.name ILIKE ${'%' + query + '%'}
          OR b.name ILIKE ${'%' + normalizedQuery + '%'}
          OR similarity(p.name, ${query}) > 0.4
          OR similarity(p.name, ${normalizedQuery}) > 0.4
          OR similarity(b.name, ${query}) > 0.4
          OR similarity(b.name, ${normalizedQuery}) > 0.4
        )
      ORDER BY 
        relevance DESC,
        p.is_featured DESC,
        p.name ASC
      LIMIT ${limit}
    `;

    const filteredProducts = products.filter(p => p.relevance > 0);

    res.json({ 
      data: filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.image_url,
        priceMin: p.price_min,
        priceMax: p.price_max,
        isFeatured: p.is_featured,
        status: p.status,
        brand: {
          id: p.brand_id,
          name: p.brand_name,
          slug: p.brand_slug,
          sector: {
            color: p.sector_color,
          },
        },
      })),
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Liste des produits tendances (admin) - DOIT ÊTRE AVANT /:id
app.get('/api/admin/products/trending', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        brand: {
          include: {
            sector: true,
          },
        },
      },
    });

    res.json({ data: products });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Toggle produit tendance (admin)
app.put('/api/admin/products/:id/toggle-featured', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isFeatured: !product.isFeatured },
      include: {
        brand: {
          include: {
            sector: true,
          },
        },
      },
    });

    res.json({ 
      data: updated,
      message: updated.isFeatured ? 'Produit ajouté aux tendances' : 'Produit retiré des tendances',
    });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/admin/brands/:brandId/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { brandId: req.params.brandId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });

    res.json({ data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        brand: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const data = req.body;
    
    const slug = data.slug || data.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const product = await prisma.product.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        slug,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        imageUrl: data.imageUrl,
        galleryUrls: data.galleryUrls || [],
        categoryId: data.categoryId || null,
        priceMin: data.priceMin ? parseFloat(data.priceMin) : null,
        priceMax: data.priceMax ? parseFloat(data.priceMax) : null,
        currency: data.currency || 'EUR',
        manufacturingLocation: data.manufacturingLocation,
        materials: data.materials || [],
        externalBuyUrl: data.externalBuyUrl,
        affiliateUrl: data.affiliateUrl,
        tags: data.tags || [],
        attributes: data.attributes || {},
        status: data.status || 'ACTIVE',
        isFeatured: data.isFeatured || false,
      },
      include: {
        category: true,
      },
    });

    res.json({ data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const data = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        descriptionShort: data.descriptionShort,
        descriptionLong: data.descriptionLong,
        imageUrl: data.imageUrl,
        galleryUrls: data.galleryUrls || [],
        categoryId: data.categoryId || null,
        priceMin: data.priceMin ? parseFloat(data.priceMin) : null,
        priceMax: data.priceMax ? parseFloat(data.priceMax) : null,
        currency: data.currency,
        manufacturingLocation: data.manufacturingLocation,
        materials: data.materials || [],
        externalBuyUrl: data.externalBuyUrl,
        affiliateUrl: data.affiliateUrl,
        tags: data.tags || [],
        attributes: data.attributes || {},
        status: data.status,
        isFeatured: data.isFeatured,
      },
      include: {
        category: true,
      },
    });

    res.json({ data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// PUBLIC PRODUCTS API
// ===========================================

// Liste tous les produits avec filtres et recherche floue
app.get('/api/v1/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 24, 100);
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;
    const query = (req.query.q as string) || '';
    const sector = (req.query.sector as string) || '';
    const sort = (req.query.sort as string) || 'newest';
    const priceMin = parseFloat(req.query.priceMin as string) || 0;
    const priceMax = parseFloat(req.query.priceMax as string) || 0;

    // Si recherche, utiliser pg_trgm pour fuzzy search
    if (query.trim()) {
      const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      let sectorFilter = '';
      if (sector) {
        sectorFilter = `AND s.slug = '${sector}'`;
      }
      
      let priceFilter = '';
      if (priceMin > 0) {
        priceFilter += ` AND p.price_min >= ${priceMin}`;
      }
      if (priceMax > 0) {
        priceFilter += ` AND p.price_max <= ${priceMax}`;
      }

      let orderByClause = 'similarity DESC, p.name ASC';
      switch (sort) {
        case 'price-asc':
          orderByClause = 'p.price_min ASC NULLS LAST';
          break;
        case 'price-desc':
          orderByClause = 'p.price_min DESC NULLS LAST';
          break;
        case 'name-asc':
          orderByClause = 'p.name ASC';
          break;
      }

      const products = await prisma.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        slug: string;
        image_url: string | null;
        price_min: number | null;
        price_max: number | null;
        brand_name: string;
        brand_slug: string;
        sector_color: string | null;
        similarity: number;
      }>>(`
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.image_url,
          p.price_min,
          p.price_max,
          b.name as brand_name,
          b.slug as brand_slug,
          s.color as sector_color,
          GREATEST(
            similarity(p.name, $1),
            similarity(p.name, $2),
            similarity(b.name, $1),
            similarity(b.name, $2)
          ) as similarity
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sectors s ON b.sector_id = s.id
        WHERE 
          p.status = 'ACTIVE'
          ${sectorFilter}
          ${priceFilter}
          AND (
            p.name ILIKE $3
            OR p.name ILIKE $4
            OR b.name ILIKE $3
            OR b.name ILIKE $4
            OR similarity(p.name, $1) > 0.2
            OR similarity(p.name, $2) > 0.2
            OR similarity(b.name, $1) > 0.2
            OR similarity(b.name, $2) > 0.2
          )
        ORDER BY ${orderByClause}
        LIMIT $5
        OFFSET $6
      `, query, normalizedQuery, `%${query}%`, `%${normalizedQuery}%`, limit, skip);

      const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*) as count
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sectors s ON b.sector_id = s.id
        WHERE 
          p.status = 'ACTIVE'
          ${sectorFilter}
          ${priceFilter}
          AND (
            p.name ILIKE $1
            OR p.name ILIKE $2
            OR b.name ILIKE $1
            OR b.name ILIKE $2
            OR similarity(p.name, $3) > 0.2
            OR similarity(p.name, $4) > 0.2
            OR similarity(b.name, $3) > 0.2
            OR similarity(b.name, $4) > 0.2
          )
      `, `%${query}%`, `%${normalizedQuery}%`, query, normalizedQuery);

      const total = Number(countResult[0]?.count || 0);

      return res.json({
        data: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          imageUrl: p.image_url,
          priceMin: p.price_min,
          priceMax: p.price_max,
          brand: {
            name: p.brand_name,
            slug: p.brand_slug,
            sector: { color: p.sector_color }
          }
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    // Sans recherche, utiliser Prisma classique
    const where: any = { status: 'ACTIVE' };

    if (sector) {
      where.brand = { sector: { slug: sector } };
    }

    if (priceMin > 0) {
      where.priceMin = { gte: priceMin };
    }

    if (priceMax > 0) {
      where.priceMax = { lte: priceMax };
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { priceMin: 'asc' };
        break;
      case 'price-desc':
        orderBy = { priceMin: 'desc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          brand: {
            select: {
              name: true,
              slug: true,
              sector: { select: { color: true } }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        brand: {
          name: p.brand.name,
          slug: p.brand.slug,
          sector: p.brand.sector
        }
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Produits tendances
app.get('/api/v1/products/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    
    const trendingProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        brand: {
          include: {
            sector: true,
          },
        },
      },
    });

    let products = trendingProducts;
    if (products.length < limit) {
      const additionalProducts = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: products.map(p => p.id) },
        },
        take: limit - products.length,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: {
            include: {
              sector: true,
            },
          },
        },
      });
      products = [...products, ...additionalProducts];
    }

    res.json({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.descriptionShort,
        imageUrl: p.imageUrl,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        currency: p.currency,
        buyUrl: p.externalBuyUrl,
        isFeatured: p.isFeatured,
        brand: {
          id: p.brand.id,
          name: p.brand.name,
          slug: p.brand.slug,
          sectorColor: p.brand.sector?.color || '#002395',
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Détail d'un produit par slug
app.get('/api/v1/products/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { 
        slug: req.params.slug,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        brand: {
          include: {
            region: true,
            sector: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        descriptionShort: product.descriptionShort,
        descriptionLong: product.descriptionLong,
        imageUrl: product.imageUrl,
        galleryUrls: product.galleryUrls,
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        currency: product.currency,
        manufacturingLocation: product.manufacturingLocation,
        materials: product.materials,
        madeInFranceLevel: product.madeInFranceLevel,
        externalBuyUrl: product.externalBuyUrl,
        tags: product.tags,
        category: product.category,
        brand: {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
          logoUrl: product.brand.logoUrl,
          websiteUrl: product.brand.websiteUrl,
          city: product.brand.city,
          region: product.brand.region,
          sector: product.brand.sector,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

app.get('/api/v1/brands/:slug/products', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const products = await prisma.product.findMany({
      where: { 
        brandId: brand.id,
        status: 'ACTIVE',
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
      },
    });

    res.json({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.descriptionShort,
        imageUrl: p.imageUrl,
        galleryUrls: p.galleryUrls,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        currency: p.currency,
        buyUrl: p.externalBuyUrl,
        category: p.category?.name || null,
        isFeatured: p.isFeatured,
      })),
    });
  } catch (error) {
    console.error('Error fetching brand products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// UPLOAD API (Cloudinary)
// ===========================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const folder = (req.query.folder as string) || 'made-in-france';
    
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    res.json({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      }
    });
  } catch (error) {
    console.error('Error uploading:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload', details: String(error) });
  }
});

app.post('/api/upload/multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const folder = (req.query.folder as string) || 'made-in-france';
    
    const uploadPromises = files.map(file => 
      new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      })
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      data: results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      }))
    });
  } catch (error) {
    console.error('Error uploading multiple:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload', details: String(error) });
  }
});

app.delete('/api/upload/:publicId(*)', async (req, res) => {
  try {
    const publicId = req.params.publicId;
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image supprimée' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression', details: String(error) });
  }
});

// Produits d'une marque pour l'espace marque (inclut tous les status)
app.get('/api/v1/brands/:slug/products/all', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const products = await prisma.product.findMany({
      where: { 
        brandId: brand.id,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        category: true,
      },
    });

    res.json({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        descriptionShort: p.descriptionShort,
        imageUrl: p.imageUrl,
        galleryUrls: p.galleryUrls,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        currency: p.currency,
        externalBuyUrl: p.externalBuyUrl,
        status: p.status,
        isFeatured: p.isFeatured,
      })),
    });
  } catch (error) {
    console.error('Error fetching all brand products:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// CREATE ADMIN USER (à exécuter une seule fois)
// ===========================================
app.post('/api/admin/setup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingAdmin = await prisma.adminUser.findFirst();
    if (existingAdmin) {
      return res.status(400).json({ error: 'Un admin existe déjà' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'super_admin',
      },
    });

    res.json({
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      message: 'Admin créé avec succès',
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// ===========================================
// UNIFIED SEARCH API (Brands + Products)
// ===========================================
app.get('/api/v1/search/all', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!query.trim()) {
      return res.json({ brands: [], products: [], query: '' });
    }

    // Recherche des marques
    const brands = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      description_short: string | null;
      logo_url: string | null;
      city: string | null;
      sector_name: string | null;
      sector_slug: string | null;
      sector_color: string | null;
      similarity: number;
    }>>`
      SELECT 
        b.id,
        b.name,
        b.slug,
        b.description_short,
        b.logo_url,
        b.city,
        s.name as sector_name,
        s.slug as sector_slug,
        s.color as sector_color,
        GREATEST(
          similarity(b.name, ${query}),
          similarity(COALESCE(b.description_short, ''), ${query})
        ) as similarity
      FROM brands b
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE 
        b.name ILIKE ${'%' + query + '%'}
        OR b.description_short ILIKE ${'%' + query + '%'}
        OR similarity(b.name, ${query}) > 0.3
      ORDER BY similarity DESC, b.name ASC
      LIMIT ${limit}
    `;

    // Recherche des produits
    const products = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      description_short: string | null;
      image_url: string | null;
      price_min: number | null;
      price_max: number | null;
      brand_name: string;
      brand_slug: string;
      sector_color: string | null;
      similarity: number;
    }>>`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description_short,
        p.image_url,
        p.price_min,
        p.price_max,
        b.name as brand_name,
        b.slug as brand_slug,
        s.color as sector_color,
        GREATEST(
          similarity(p.name, ${query}),
          similarity(COALESCE(p.description_short, ''), ${query})
        ) as similarity
      FROM products p
      JOIN brands b ON p.brand_id = b.id
      LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE 
        p.status = 'ACTIVE'
        AND (
          p.name ILIKE ${'%' + query + '%'}
          OR p.description_short ILIKE ${'%' + query + '%'}
          OR similarity(p.name, ${query}) > 0.3
        )
      ORDER BY similarity DESC, p.name ASC
      LIMIT ${limit}
    `;

    res.json({
      brands: brands.map(b => ({
        type: 'brand',
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description_short,
        logoUrl: b.logo_url,
        city: b.city,
        sector: b.sector_name,
        sectorSlug: b.sector_slug,
        sectorColor: b.sector_color,
      })),
      products: products.map(p => ({
        type: 'product',
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description_short,
        imageUrl: p.image_url,
        priceMin: p.price_min,
        priceMax: p.price_max,
        brandName: p.brand_name,
        brandSlug: p.brand_slug,
        sectorColor: p.sector_color,
      })),
      query,
    });
  } catch (error) {
    console.error('Error in unified search:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

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
  const limit = Math.min(params.limit || 32, 40);

  // Fix encodage HTML
  if (params.sector) params.sector = params.sector.replace(/&amp;/g, '&');

  let whereConditions = [
    `p.status = 'ACTIVE'`,
    `p.price_min > 0`,
    `p.price_min IS NOT NULL`,
    `p.image_url IS NOT NULL`,
  ];

  if (params.max_price) {
    whereConditions.push(`p.price_min <= ${params.max_price}`);
  }
  if (params.min_price) {
    whereConditions.push(`p.price_min >= ${params.min_price}`);
  }
  if (params.sector) {
    whereConditions.push(`s.name = '${params.sector}'`);
  }
  if (params.target) {
    whereConditions.push(`(p.attributes->>'target' = '${params.target}' OR p.attributes->>'target' = 'mixte' OR p.attributes->>'target' IS NULL)`);
  }

  // Recherche par mots-clés
  const keywords = params.query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map(k => `(
      p.name ILIKE '%${k}%'
      OR p.tags::text ILIKE '%${k}%'
      OR p.materials::text ILIKE '%${k}%'
      OR p.description_short ILIKE '%${k}%'
      OR b.name ILIKE '%${k}%'
    )`).join(' AND ');
    whereConditions.push(`(${keywordConditions})`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Requête avec diversification par marque (max 3 produits par marque, puis on mélange)
  const query = `
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
      WHERE ${whereClause}
    )
    SELECT id, name, slug, description_short, image_url, price_min, price_max,
           external_buy_url, brand_name, brand_slug, brand_city, sector_name, sector_color
    FROM ranked_products
    WHERE brand_rank <= 3
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;

  try {
    const products = await prisma.$queryRawUnsafe(query);
    return products as any[];
  } catch (e) {
    console.error('Search products error:', e);
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
  const limit = Math.min(params.limit || 8, 12);
  
  // Fix encodage HTML
  if (params.sector) params.sector = params.sector.replace(/&amp;/g, '&');
  
  let whereConditions = [`b.status = 'ACTIVE'`];
  
  if (params.sector) {
    whereConditions.push(`s.name = '${params.sector}'`);
  }
  if (params.region) {
    whereConditions.push(`r.name ILIKE '%${params.region}%'`);
  }

  // Recherche par mots-clés
  const keywords = params.query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map(k => `(
      b.name ILIKE '%${k}%'
      OR b.description_short ILIKE '%${k}%'
      OR s.name ILIKE '%${k}%'
      OR (b.ai_generated_content->>'tags')::text ILIKE '%${k}%'
    )`).join(' OR ');
    whereConditions.push(`(${keywordConditions})`);
  }

  const whereClause = whereConditions.join(' AND ');

  const query = `
    SELECT 
      b.id, b.name, b.slug, b.description_short, b.logo_url, b.city,
      b.website_url, b.year_founded,
      s.name as sector_name, s.color as sector_color,
      r.name as region_name,
      (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE') as product_count
    FROM brands b
    LEFT JOIN sectors s ON b.sector_id = s.id
    LEFT JOIN regions r ON b.region_id = r.id
    WHERE ${whereClause}
    ORDER BY 
      CASE WHEN b.name ILIKE '%${keywords[0] || ''}%' THEN 0 ELSE 1 END,
      b.name ASC
    LIMIT ${limit}
  `;

  try {
    const brands = await prisma.$queryRawUnsafe(query);
    // Log pour debug les website_url
    console.log('🔍 Brands found with website_url:', (brands as any[]).map(b => ({
      name: b.name,
      website_url: b.website_url,
      logo_url: b.logo_url
    })));
    return brands as any[];
  } catch (e) {
    console.error('Search brands error:', e);
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

    console.log('💬 Chat request:', message);

    // Charger les settings IA depuis la BDD
    let aiSettings: any = null;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'ai_settings' }
      });
      if (setting) {
        aiSettings = setting.value as any;
      }
    } catch (e) {
      console.log('⚠️ Pas de settings IA en BDD, utilisation des valeurs par défaut');
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
        console.log('📋 Règle appliquée:', rule.keyword);
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
      const openaiKey = aiSettings?.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(400).json({ error: 'Clé OpenAI non configurée' });
      }

      // TODO: Implémenter OpenAI avec tool use
      return res.status(400).json({ error: 'OpenAI pas encore implémenté avec tool use. Utilisez Claude.' });
    }

    // Utiliser Anthropic (Claude)
    const anthropicKey = aiSettings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
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

    console.log('🤖 Claude response:', response.stop_reason, '| Model:', model);
    console.log('📋 Response content types:', response.content.map(b => b.type).join(', '));

    let relevantProducts: any[] = [];
    let relevantBrands: any[] = [];

    // Boucle pour gérer les appels d'outils
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) break;

      console.log('🔧 Tool call:', toolUseBlock.name, JSON.stringify(toolUseBlock.input));

      let toolResult: any;

      if (toolUseBlock.name === 'search_products') {
        const products = await executeSearchProducts(toolUseBlock.input as any);
        relevantProducts = products;
        console.log('📦 Products found:', products.length);
        toolResult = products.length > 0
          ? `Trouvé ${products.length} produits: ${products.map((p: any) => `${p.name} (${p.brand_name}) - ${p.price_min}€`).join(', ')}`
          : 'Aucun produit trouvé';
      } else if (toolUseBlock.name === 'search_brands') {
        const brands = await executeSearchBrands(toolUseBlock.input as any);
        relevantBrands = brands;
        console.log('🏢 Brands found:', brands.length);
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

    console.log('✅ Final response:', {
      messageLength: finalMessage.length,
      productsCount: formattedProducts.length,
      brandsCount: formattedBrands.length,
      brandsWithWebsiteUrl: formattedBrands.filter((b: any) => b.websiteUrl).length,
      sampleBrands: formattedBrands.slice(0, 3).map((b: any) => ({ name: b.name, websiteUrl: b.websiteUrl }))
    });

    res.json({
      message: finalMessage,
      products: formattedProducts,
      brands: formattedBrands,
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ error: 'Erreur du chat IA' });
  }
});

// ===========================================
// ESPACE MARQUE - DASHBOARD B2B
// ===========================================

// Vérifier si l'utilisateur est propriétaire d'une marque
app.get('/api/v1/brands/:slug/ownership', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.json({ isOwner: false, role: null });
    }

    const brand = await prisma.brand.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const ownership = await prisma.brandOwner.findUnique({
      where: {
        brandId_userId: {
          brandId: brand.id,
          userId: userId as string
        }
      },
      select: { role: true, isActive: true }
    });

    if (ownership && ownership.isActive) {
      return res.json({ isOwner: true, role: ownership.role });
    }

    return res.json({ isOwner: false, role: null });
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dashboard marque - Récupérer les stats et infos (protégé)
app.get('/api/v1/brands/:slug/dashboard', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer la marque
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        sector: true,
        region: true,
        labels: { include: { label: true } },
        owners: {
          where: { userId: userId as string, isActive: true },
          select: { role: true }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Vérifier que l'utilisateur est bien propriétaire
    if (brand.owners.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const userRole = brand.owners[0].role;

    // Compter les produits
    const productCount = await prisma.product.count({
  where: { brandId: brand.id, status: 'ACTIVE' }
});

    // Compter les favoris (si le système existe)
    let favoriteCount = 0;
    try {
      favoriteCount = await prisma.favorite.count({
        where: { brandId: brand.id }
      });
    } catch (e) {
      // Table favorites peut ne pas exister
    }

    // Stats simulées pour l'instant (à remplacer par vraies analytics plus tard)
    const stats = {
      views: Math.floor(Math.random() * 1000) + 100,
      clicks: Math.floor(Math.random() * 200) + 20,
      favorites: favoriteCount,
      products: productCount,
      conversionRate: (Math.random() * 5 + 1).toFixed(2) + '%'
    };

    res.json({
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        story: brand.story,
        logoUrl: brand.logoUrl,
        websiteUrl: brand.websiteUrl,
        email: brand.email,
        phone: brand.phone,
        address: brand.address,
        postalCode: brand.postalCode,
        city: brand.city,
        sector: brand.sector,
        region: brand.region,
        labels: brand.labels.map(l => l.label),
        socialLinks: brand.socialLinks,
        aiGeneratedContent: brand.aiGeneratedContent,
        photos: brand.photos,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt
      },
      stats,
      userRole
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Dashboard marque - Modifier les infos (protégé)
app.put('/api/v1/brands/:slug/dashboard', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer la marque et vérifier ownership
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        owners: {
          where: { userId: userId as string, isActive: true },
          select: { role: true }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    if (brand.owners.length === 0) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const userRole = brand.owners[0].role;

    // Vérifier les permissions selon le rôle
    if (userRole === 'VIEWER') {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    // Champs autorisés à modifier
    const allowedFields = [
  'name', 'description', 'descriptionShort', 'descriptionLong', 'story',
  'email', 'phone', 'address', 'postalCode', 'city',
  'latitude', 'longitude',
  'websiteUrl', 'videoUrl', 'socialLinks',
  'sectorId', 'regionId',
  'yearFounded',
  'logoUrl', 'coverImageUrl', 'galleryUrls', 'photos',
  'aiGeneratedContent',
  'seoTitle', 'seoDescription'
];

    // Filtrer les champs non autorisés
    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Mettre à jour
    const updatedBrand = await prisma.brand.update({
      where: { id: brand.id },
      data: filteredUpdates
    });

    res.json({
      success: true,
      brand: updatedBrand
    });

  } catch (error) {
    console.error('Dashboard update error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des propriétaires d'une marque (pour les OWNER/ADMIN)
app.get('/api/v1/brands/:slug/owners', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        owners: {
          where: { userId: userId as string, isActive: true },
          select: { role: true }
        }
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Seuls OWNER et ADMIN peuvent voir la liste
    if (brand.owners.length === 0 || !['OWNER', 'ADMIN'].includes(brand.owners[0].role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const owners = await prisma.brandOwner.findMany({
      where: { brandId: brand.id, isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      owners: owners.map(o => ({
        id: o.id,
        role: o.role,
        user: o.user,
        invitedAt: o.invitedAt,
        acceptedAt: o.acceptedAt
      }))
    });

  } catch (error) {
    console.error('Owners list error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Activer tous les produits (rendre visibles)
app.post('/api/admin/products/activate-all', async (req, res) => {
  try {
    const result = await prisma.product.updateMany({
      where: { status: 'INACTIVE' },
      data: { status: 'ACTIVE' }
    });

    res.json({
      success: true,
      count: result.count,
      message: `${result.count} produits rendus visibles`
    });
  } catch (error) {
    console.error('Activate all products error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// AUTHENTIFICATION - INSCRIPTION
// ===========================================

// Inscription d'un nouvel utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, companyName, phone, siret, claimBrandSlug, plan } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Si revendication d'une marque existante
    if (claimBrandSlug) {
      const brand = await prisma.brand.findUnique({
        where: { slug: claimBrandSlug },
      });

      if (brand) {
        // Créer la demande de revendication ou associer directement
        await prisma.brandOwner.create({
          data: {
            brandId: brand.id,
            userId: user.id,
            role: 'OWNER',
            isActive: true,
          },
        });
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Réclamer une marque (utilisateur déjà connecté)
app.post('/api/auth/claim-brand', async (req, res) => {
  try {
    const { userId, brandSlug } = req.body;

    if (!userId || !brandSlug) {
      return res.status(400).json({ error: 'userId et brandSlug requis' });
    }

    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Vérifier si déjà propriétaire
    const existingOwner = await prisma.brandOwner.findUnique({
      where: {
        brandId_userId: {
          brandId: brand.id,
          userId: userId,
        },
      },
    });

    if (existingOwner) {
      return res.json({ success: true, message: 'Déjà propriétaire' });
    }

    // Créer l'association
    await prisma.brandOwner.create({
      data: {
        brandId: brand.id,
        userId: userId,
        role: 'OWNER',
        isActive: true,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Claim brand error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les marques d'un utilisateur (par email)
app.get('/api/v1/user/brands', async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedBrands: {
          where: { isActive: true },
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                websiteUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.json({ brands: [] });
    }

    const brands = user.ownedBrands.map(ob => ({
      ...ob.brand,
      role: ob.role,
    }));

    res.json({ brands });
  } catch (error) {
    console.error('Get user brands error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// LABELS API
// ===========================================

// Récupérer tous les labels
app.get('/api/v1/labels', async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ data: labels });
  } catch (error) {
    console.error('Get labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les labels d'une marque
app.get('/api/v1/brands/:slug/labels', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const labels = brand.labels.map(bl => bl.label);
    res.json({ data: labels });
  } catch (error) {
    console.error('Get brand labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un label à une marque (Premium+)
app.post('/api/v1/brands/:slug/labels', async (req, res) => {
  try {
    const { slug } = req.params;
    const { labelId } = req.body;

    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Vérifier que la marque a un plan Premium ou Royale
    if (brand.subscriptionTier === 'FREE') {
      return res.status(403).json({ error: 'Fonctionnalité Premium requise' });
    }

    await prisma.brandLabel.create({
      data: {
        brandId: brand.id,
        labelId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Add brand label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un label d'une marque
app.delete('/api/v1/brands/:slug/labels/:labelId', async (req, res) => {
  try {
    const { slug, labelId } = req.params;

    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    await prisma.brandLabel.delete({
      where: {
        brandId_labelId: {
          brandId: brand.id,
          labelId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// ADMIN LABELS API (Superadmin)
// ===========================================

// Récupérer tous les labels avec statistiques d'utilisation
app.get('/api/admin/labels', async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            brands: true,
            products: true,
          },
        },
      },
    });

    const labelsWithStats = labels.map(label => ({
      ...label,
      brandsCount: label._count.brands,
      productsCount: label._count.products,
    }));

    res.json({ data: labelsWithStats });
  } catch (error) {
    console.error('Admin get labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau label
app.post('/api/admin/labels', async (req, res) => {
  try {
    const { name, slug, description, logoUrl, websiteUrl } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nom et slug requis' });
    }

    // Vérifier que le slug est unique
    const existing = await prisma.label.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Ce slug existe déjà' });
    }

    const label = await prisma.label.create({
      data: {
        name,
        slug,
        description: description || null,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
      },
    });

    res.json({ data: label });
  } catch (error) {
    console.error('Admin create label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un label
app.put('/api/admin/labels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, logoUrl, websiteUrl } = req.body;

    // Vérifier que le label existe
    const existing = await prisma.label.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Label non trouvé' });
    }

    // Si le slug change, vérifier qu'il est unique
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.label.findUnique({ where: { slug } });
      if (slugExists) {
        return res.status(400).json({ error: 'Ce slug existe déjà' });
      }
    }

    const label = await prisma.label.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: slug || existing.slug,
        description: description !== undefined ? description : existing.description,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
        websiteUrl: websiteUrl !== undefined ? websiteUrl : existing.websiteUrl,
      },
    });

    res.json({ data: label });
  } catch (error) {
    console.error('Admin update label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un label
app.delete('/api/admin/labels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le label existe
    const existing = await prisma.label.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            brands: true,
            products: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Label non trouvé' });
    }

    // Supprimer d'abord les relations
    await prisma.brandLabel.deleteMany({ where: { labelId: id } });
    await prisma.productLabel.deleteMany({ where: { labelId: id } });

    // Supprimer le label
    await prisma.label.delete({ where: { id } });

    res.json({ success: true, deletedRelations: { brands: existing._count.brands, products: existing._count.products } });
  } catch (error) {
    console.error('Admin delete label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Voir quelles marques utilisent un label
app.get('/api/admin/labels/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;

    const label = await prisma.label.findUnique({
      where: { id },
      include: {
        brands: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                subscriptionTier: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 50, // Limiter le nombre de produits
        },
      },
    });

    if (!label) {
      return res.status(404).json({ error: 'Label non trouvé' });
    }

    res.json({
      data: {
        label: {
          id: label.id,
          name: label.name,
          slug: label.slug,
        },
        brands: label.brands.map(bl => bl.brand),
        products: label.products.map(pl => pl.product),
        totalBrands: label.brands.length,
        totalProducts: label.products.length,
      },
    });
  } catch (error) {
    console.error('Admin label usage error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// ADMIN BRAND LABELS API (sans vérification tier)
// ===========================================

// Ajouter un label à une marque (admin - sans restriction tier)
app.post('/api/admin/brands/:id/labels', async (req, res) => {
  try {
    const { id } = req.params;
    const { labelId } = req.body;

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Vérifier que l'association n'existe pas déjà
    const existing = await prisma.brandLabel.findUnique({
      where: {
        brandId_labelId: {
          brandId: id,
          labelId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ce label est déjà associé à la marque' });
    }

    await prisma.brandLabel.create({
      data: {
        brandId: id,
        labelId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin add brand label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un label d'une marque (admin)
app.delete('/api/admin/brands/:id/labels/:labelId', async (req, res) => {
  try {
    const { id, labelId } = req.params;

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    await prisma.brandLabel.delete({
      where: {
        brandId_labelId: {
          brandId: id,
          labelId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete brand label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les labels d'une marque par ID (admin)
app.get('/api/admin/brands/:id/labels', async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const labels = brand.labels.map(bl => bl.label);
    res.json({ data: labels });
  } catch (error) {
    console.error('Admin get brand labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// PRODUCT LABELS API
// ===========================================

// Récupérer les labels d'un produit
app.get('/api/v1/products/:id/labels', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const labels = product.labels.map(pl => pl.label);
    res.json({ data: labels });
  } catch (error) {
    console.error('Get product labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un label à un produit (admin)
app.post('/api/admin/products/:id/labels', async (req, res) => {
  try {
    const { id } = req.params;
    const { labelId } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Vérifier que l'association n'existe pas déjà
    const existing = await prisma.productLabel.findUnique({
      where: {
        productId_labelId: {
          productId: id,
          labelId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ce label est déjà associé au produit' });
    }

    await prisma.productLabel.create({
      data: {
        productId: id,
        labelId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Add product label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un label d'un produit (admin)
app.delete('/api/admin/products/:id/labels/:labelId', async (req, res) => {
  try {
    const { id, labelId } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    await prisma.productLabel.delete({
      where: {
        productId_labelId: {
          productId: id,
          labelId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete product label error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Seed des labels français (à exécuter une fois)
app.post('/api/v1/labels/seed', async (req, res) => {
  try {
    const labelsData = [
      { name: 'Entreprise du Patrimoine Vivant', slug: 'epv', description: 'Label d\'État distinguant les entreprises françaises aux savoir-faire artisanaux et industriels d\'excellence', logoUrl: '/labels/epv.png' },
      { name: 'Origine France Garantie', slug: 'origine-france-garantie', description: 'Certification attestant l\'origine française des produits', logoUrl: '/labels/ofg.png' },
      { name: 'France Terre Textile', slug: 'france-terre-textile', description: 'Label garantissant qu\'au moins 75% des opérations de fabrication sont réalisées en France', logoUrl: '/labels/ftt.png' },
      { name: 'Made in France', slug: 'made-in-france', description: 'Indication d\'origine garantissant une fabrication française', logoUrl: '/labels/mif.png' },
      { name: 'Fabriqué en France', slug: 'fabrique-en-france', description: 'Mention attestant une fabrication sur le territoire français', logoUrl: '/labels/fef.png' },
      { name: 'Label Alsace', slug: 'label-alsace', description: 'Label régional valorisant les produits alsaciens', logoUrl: '/labels/alsace.png' },
      { name: 'Produit en Bretagne', slug: 'produit-en-bretagne', description: 'Label régional valorisant les produits bretons', logoUrl: '/labels/bretagne.png' },
      { name: 'Sud de France', slug: 'sud-de-france', description: 'Label régional valorisant les produits du Sud de la France', logoUrl: '/labels/sdf.png' },
      { name: 'Saveurs Paris Île-de-France', slug: 'saveurs-paris-idf', description: 'Label régional valorisant les produits franciliens', logoUrl: '/labels/spidf.png' },
      { name: 'Qualité Tourisme', slug: 'qualite-tourisme', description: 'Marque d\'État attestant de la qualité des prestations touristiques', logoUrl: '/labels/qt.png' },
      { name: 'Bio', slug: 'bio', description: 'Certification agriculture biologique européenne', logoUrl: '/labels/bio.png' },
      { name: 'Agriculture Biologique', slug: 'ab', description: 'Label français de l\'agriculture biologique', logoUrl: '/labels/ab.png' },
      { name: 'AOP', slug: 'aop', description: 'Appellation d\'Origine Protégée', logoUrl: '/labels/aop.png' },
      { name: 'IGP', slug: 'igp', description: 'Indication Géographique Protégée', logoUrl: '/labels/igp.png' },
      { name: 'Label Rouge', slug: 'label-rouge', description: 'Signe de qualité supérieure pour les produits alimentaires', logoUrl: '/labels/lr.png' },
      { name: 'Bleu Blanc Cœur', slug: 'bleu-blanc-coeur', description: 'Label garantissant une alimentation plus responsable', logoUrl: '/labels/bbc.png' },
      { name: 'NF', slug: 'nf', description: 'Certification de conformité aux normes françaises', logoUrl: '/labels/nf.png' },
      { name: 'ISO 9001', slug: 'iso-9001', description: 'Certification de management de la qualité', logoUrl: '/labels/iso9001.png' },
      { name: 'ISO 14001', slug: 'iso-14001', description: 'Certification de management environnemental', logoUrl: '/labels/iso14001.png' },
      { name: 'B Corp', slug: 'b-corp', description: 'Certification des entreprises à impact social et environnemental positif', logoUrl: '/labels/bcorp.png' },
    ];

    for (const label of labelsData) {
      await prisma.label.upsert({
        where: { slug: label.slug },
        update: label,
        create: label,
      });
    }

    res.json({ success: true, count: labelsData.length });
  } catch (error) {
    console.error('Seed labels error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// STRIPE PAYMENTS
// ===========================================

import Stripe from 'stripe';

// Prix des abonnements (à créer dans Stripe Dashboard)
const PRICE_IDS = {
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || '',
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY || '',
  ROYALE_MONTHLY: process.env.STRIPE_PRICE_ROYALE_MONTHLY || '',
  ROYALE_YEARLY: process.env.STRIPE_PRICE_ROYALE_YEARLY || '',
};

// Créer une session de paiement Stripe
app.post('/api/v1/stripe/create-checkout-session', async (req, res) => {
  try {
    console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY?.length, 'value:', process.env.STRIPE_SECRET_KEY);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    const { brandSlug, plan, billingCycle, userEmail } = req.body;

    if (!brandSlug || !plan || !billingCycle) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Déterminer le prix
    let priceId: string;
    let amount: number;
    
    if (plan === 'PREMIUM') {
      priceId = billingCycle === 'yearly' ? PRICE_IDS.PREMIUM_YEARLY : PRICE_IDS.PREMIUM_MONTHLY;
      amount = billingCycle === 'yearly' ? 29000 : 2900; // en centimes
    } else if (plan === 'ROYALE') {
      priceId = billingCycle === 'yearly' ? PRICE_IDS.ROYALE_YEARLY : PRICE_IDS.ROYALE_MONTHLY;
      amount = billingCycle === 'yearly' ? 99000 : 9900;
    } else {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    // Créer ou récupérer le customer Stripe
    let customerId = brand.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          brandId: brand.id,
          brandSlug: brand.slug,
        },
      });
      customerId = customer.id;
      
      // Sauvegarder l'ID customer
      await prisma.brand.update({
        where: { id: brand.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Made in France Studio - ${plan === 'PREMIUM' ? 'Premium' : 'Royale'}`,
              description: billingCycle === 'yearly' ? 'Abonnement annuel' : 'Abonnement mensuel',
            },
            unit_amount: amount,
            recurring: {
              interval: billingCycle === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/studio/marque/${brandSlug}/abonnement?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/studio/marque/${brandSlug}/abonnement?canceled=true`,
      metadata: {
        brandId: brand.id,
        brandSlug: brand.slug,
        plan,
        billingCycle,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement', details: error instanceof Error ? error.message : String(error) });
  }
});

// Webhook Stripe pour gérer les événements
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
  });
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
        console.log(`✅ Brand ${brandId} upgraded to ${plan}`);
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
          console.log(`⚠️ Brand ${brand.id} subscription inactive, downgraded to FREE`);
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
        console.log(`🔴 Brand ${brand.id} subscription canceled, downgraded to FREE`);
      }
      break;
    }
  }

  res.json({ received: true });
});

// Créer un portail client pour gérer l'abonnement
app.post('/api/v1/stripe/create-portal-session', async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    const { brandSlug } = req.body;

    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand || !brand.stripeCustomerId) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: brand.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/studio/marque/${brandSlug}/abonnement`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du portail' });
  }
});

// ===========================================
// CLOUDINARY UPLOAD
// ===========================================

// Upload d'image pour une marque
app.post('/api/v1/brands/:slug/upload', upload.single('image'), async (req, res) => {
  try {
    const { slug } = req.params;
    const { type } = req.body; // 'logo' ou 'photo'

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    // Vérifier les limites selon le plan
    const PLAN_LIMITS = {
      FREE: { maxPhotos: 1 },
      PREMIUM: { maxPhotos: 10 },
      ROYALE: { maxPhotos: 50 },
    };

    const planLimits = PLAN_LIMITS[brand.subscriptionTier || 'FREE'];

    // Compter les photos existantes
    if (type === 'photo') {
      const existingPhotos = await prisma.brandImage.count({
        where: { brandId: brand.id },
      });

      if (existingPhotos >= planLimits.maxPhotos) {
        return res.status(403).json({ 
          error: `Limite de ${planLimits.maxPhotos} photos atteinte. Passez à un plan supérieur.` 
        });
      }
    }

    // Upload vers Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mif/brands/${slug}`,
          resource_type: 'image',
          transformation: type === 'logo' 
            ? [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
            : [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    // Sauvegarder en base
    if (type === 'logo') {
      await prisma.brand.update({
        where: { id: brand.id },
        data: { logoUrl: uploadResult.secure_url },
      });
    } else {
      await prisma.brandImage.create({
        data: {
          brandId: brand.id,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          isPrimary: false,
        },
      });
    }

    res.json({ 
      success: true, 
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Supprimer une image
app.delete('/api/v1/brands/:slug/images/:imageId', async (req, res) => {
  try {
    const { slug, imageId } = req.params;

    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const image = await prisma.brandImage.findFirst({
      where: { id: imageId, brandId: brand.id },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    // Supprimer de Cloudinary
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    // Supprimer de la base
    await prisma.brandImage.delete({ where: { id: imageId } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Récupérer les images d'une marque
app.get('/api/v1/brands/:slug/images', async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      return res.status(404).json({ error: 'Marque non trouvée' });
    }

    const images = await prisma.brandImage.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: images });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// AI SETTINGS ROUTES
// ===========================================

// GET - Charger les settings IA
app.get('/api/admin/ai/settings', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'ai_settings' }
    });
    
    if (setting) {
      res.json({ data: setting.value });
    } else {
      // Retourner les valeurs par défaut
      res.json({ data: {
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        prompt: '',
        temperature: 0.7,
        maxTokens: 1024,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        rules: []
      }});
    }
  } catch (error) {
    console.error('Erreur chargement AI settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT - Sauvegarder les settings IA
app.put('/api/admin/ai/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    await prisma.siteSetting.upsert({
      where: { key: 'ai_settings' },
      update: { value: settings },
      create: { key: 'ai_settings', value: settings }
    });
    
    // Mettre à jour les variables d'environnement en mémoire
    if (settings.anthropicApiKey) {
      process.env.ANTHROPIC_API_KEY = settings.anthropicApiKey;
    }
    if (settings.openaiApiKey) {
      process.env.OPENAI_API_KEY = settings.openaiApiKey;
    }
    if (settings.model) {
      process.env.ANTHROPIC_MODEL = settings.model;
    }
    
    console.log('✅ AI settings saved:', { model: settings.model });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde AI settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, () => {
  console.log(`\n🚀 API server running on http://localhost:${PORT}\n`);
});