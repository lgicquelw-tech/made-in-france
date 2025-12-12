import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Marques avec coordonnées ET labels (pour la carte avec filtres)
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
      })),
      total: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands with coords and labels:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
  }
});

// Marques en vedette
app.get('/api/v1/brands/featured', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      take: 8,
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
      })),
    });
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    res.status(500).json({ error: 'Erreur serveur', details: String(error) });
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
// SEARCH API
// ===========================================
app.get('/api/v1/search', async (req, res) => {
  try {
    const query = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const where = query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { descriptionShort: { contains: query, mode: 'insensitive' as const } },
        { city: { contains: query, mode: 'insensitive' as const } },
      ],
    } : {};

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
        city: brand.city,
        region: brand.region?.name || null,
        sector: brand.sector?.name || null,
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

// Régions avec nombre de marques
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

// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, () => {
  console.log(`\n🚀 API server running on http://localhost:${PORT}\n`);
});