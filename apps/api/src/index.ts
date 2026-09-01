import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
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

// Configuration Cloudinary


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
// ADMIN PRODUCTS
// ===========================================


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
// DESACTIVE — REBUILD.md T0.6.
// Cette route creait un compte super_admin sans aucune authentification ;
// le seul garde-fou etait « un admin existe deja ». A remplacer par une
// commande CLI protegee en phase 3 (T3.15).

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


// ===========================================
// ADMIN LABELS API (Superadmin)
// ===========================================


// ===========================================
// ADMIN BRAND LABELS API (sans vérification tier)
// ===========================================


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


// ===========================================
// STRIPE PAYMENTS
// ===========================================
// (l'import de Stripe est en tete de fichier — il etait duplique ici, ce qui
//  empechait le fichier de compiler : REBUILD.md T3.18)

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
    const stripe = stripeClient();
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
  const stripe = stripeClient();
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
    const stripe = stripeClient();
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


// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, () => {
  console.log(`\n🚀 API server running on http://localhost:${PORT}\n`);
});