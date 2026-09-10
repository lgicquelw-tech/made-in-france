"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_express = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_client = require("@prisma/client");
var import_express_rate_limit = __toESM(require("express-rate-limit"));

// src/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.apiKey",
      "*.anthropicApiKey",
      "*.openaiApiKey",
      "*.stripeSecretKey"
    ],
    censor: "[masqu\xE9]"
  },
  transport: process.env.NODE_ENV === "production" ? void 0 : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
});

// src/index.ts
var import_sdk = __toESM(require("@anthropic-ai/sdk"));
var import_stripe = __toESM(require("stripe"));
import_dotenv.default.config();
var STRIPE_API_VERSION = "2025-12-15.clover";
var stripeClient = () => new import_stripe.default(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
var anthropic = new import_sdk.default({
  apiKey: process.env.ANTHROPIC_API_KEY
});
var prisma = new import_client.PrismaClient();
var app = (0, import_express.default)();
var PORT = process.env.PORT || 4e3;
app.use((0, import_cors.default)());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/stripe/webhook") {
    next();
  } else {
    import_express.default.json()(req, res, next);
  }
});
var limiterGeneral = (0, import_express_rate_limit.default)({
  windowMs: 6e4,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de requ\xEAtes. R\xE9essayez dans une minute." }
});
var limiterRecherche = (0, import_express_rate_limit.default)({
  windowMs: 6e4,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de recherches. R\xE9essayez dans une minute." }
});
var limiterChat = (0, import_express_rate_limit.default)({
  windowMs: 6e4,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Vous avez atteint la limite de messages. Patientez une minute avant de continuer."
  }
});
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/stripe/webhook") return next();
  return limiterGeneral(req, res, next);
});
app.use("/api/v1/search", limiterRecherche);
app.use("/api/v1/brands/search", limiterRecherche);
app.use("/api/v1/chat", limiterChat);
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/v1/stats", async (req, res) => {
  try {
    const brandsCount = await prisma.brand.count();
    const regionsCount = await prisma.region.count();
    const sectorsCount = await prisma.sector.count();
    res.json({
      data: {
        brands: brandsCount,
        regions: regionsCount,
        sectors: sectorsCount
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching stats:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = {};
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
        orderBy: { name: "asc" },
        include: {
          region: true,
          sector: true
        }
      }),
      prisma.brand.count({ where })
    ]);
    res.json({
      data: brands.map((brand) => ({
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
        sectorColor: brand.sector?.color || null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching brands:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/with-coords", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
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
        }
      }
    });
    res.json({
      data: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        city: brand.city,
        region: brand.region?.name || null,
        websiteUrl: brand.websiteUrl,
        latitude: brand.latitude,
        longitude: brand.longitude
      })),
      total: brands.length
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching brands with coords:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/with-coords-and-labels", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
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
        }
      }
    });
    res.json({
      data: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.descriptionShort,
        city: brand.city,
        region: brand.region?.name || null,
        websiteUrl: brand.websiteUrl,
        latitude: brand.latitude,
        longitude: brand.longitude,
        labels: brand.labels.map((l) => l.label.name),
        sector: brand.sector?.name || null,
        sectorSlug: brand.sector?.slug || null,
        sectorColor: brand.sector?.color || "#002395"
      })),
      total: brands.length
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching brands with coords and labels:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/random", async (req, res) => {
  try {
    const count = await prisma.brand.count();
    const randomIndex = Math.floor(Math.random() * count);
    const brand = await prisma.brand.findFirst({
      skip: randomIndex,
      include: {
        region: true,
        sector: true
      }
    });
    if (!brand) {
      return res.status(404).json({ error: "Aucune marque trouv\xE9e" });
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
        sectorColor: brand.sector?.color || null
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching random brand:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/weekly", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const featuredBrands = await prisma.featuredBrand.findMany({
      where: {
        isActive: true,
        featuredType: "weekly",
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: { displayOrder: "asc" },
      include: {
        brand: {
          include: {
            region: true,
            sector: true,
            labels: {
              include: { label: true }
            }
          }
        }
      }
    });
    if (featuredBrands.length > 0) {
      const brands = featuredBrands.map((fb) => ({
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
        labels: fb.brand.labels.map((l) => l.label.name),
        imageUrl: fb.imageUrl,
        title: fb.title
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
          include: { label: true }
        }
      }
    });
    if (!brand) {
      return res.status(404).json({ error: "Aucune marque trouv\xE9e" });
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
        labels: brand.labels.map((l) => l.label.name)
      }],
      weekNumber
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching weekly brand:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
function getWeekNumber() {
  const now = /* @__PURE__ */ new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - startOfYear.getTime()) / 864e5 + startOfYear.getDay() + 1) / 7);
}
app.get("/api/v1/brands/featured", async (req, res) => {
  try {
    let brands = await prisma.brand.findMany({
      where: { isFeatured: true },
      take: 8,
      include: {
        region: true,
        sector: true
      }
    });
    if (brands.length < 8) {
      brands = await prisma.brand.findMany({
        take: 8,
        orderBy: [
          { isFeatured: "desc" },
          { isVerified: "desc" },
          { name: "asc" }
        ],
        include: {
          region: true,
          sector: true
        }
      });
    }
    res.json({
      data: brands.map((brand) => ({
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
        sectorColor: brand.sector?.color || null
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching featured brands:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/trending", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const trendingBrands = await prisma.trendingBrand.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } }
        ]
      },
      orderBy: { displayOrder: "asc" },
      take: 8,
      include: {
        brand: {
          include: {
            region: true,
            sector: true
          }
        }
      }
    });
    if (trendingBrands.length > 0) {
      return res.json({
        data: trendingBrands.map((tb) => ({
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
          reason: tb.reason
        }))
      });
    }
    const brands = await prisma.brand.findMany({
      take: 4,
      orderBy: { name: "asc" },
      include: {
        region: true,
        sector: true
      }
    });
    res.json({
      data: brands.map((brand) => ({
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
        reason: null
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching trending brands:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/search", async (req, res) => {
  try {
    const { q, limit = "10" } = req.query;
    if (!q || typeof q !== "string") {
      return res.json({ data: [] });
    }
    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } }
        ],
        status: "ACTIVE"
      },
      include: {
        sector: true
      },
      take: parseInt(limit),
      orderBy: { name: "asc" }
    });
    res.json({
      data: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        websiteUrl: b.websiteUrl,
        city: b.city,
        sector: b.sector ? { name: b.sector.name, color: b.sector.color } : null
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Search error:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/:slug", async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug },
      include: {
        region: true,
        sector: true,
        labels: {
          include: {
            label: true
          }
        }
      }
    });
    if (!brand) {
      return res.status(404).json({ error: "Marque non trouv\xE9e" });
    }
    res.json({ data: brand });
  } catch (error) {
    logger.error({ err: error }, "Error fetching brand:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/collections", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const collections = await prisma.collection.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } }
        ]
      },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { brands: true }
        }
      }
    });
    res.json({
      data: collections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        color: c.color,
        brandCount: c._count.brands
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching collections:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/collections/:slug", async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { slug: req.params.slug },
      include: {
        brands: {
          orderBy: { displayOrder: "asc" },
          include: {
            brand: {
              include: {
                region: true,
                sector: true
              }
            }
          }
        }
      }
    });
    if (!collection) {
      return res.status(404).json({ error: "Collection non trouv\xE9e" });
    }
    res.json({
      data: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        imageUrl: collection.imageUrl,
        color: collection.color,
        brands: collection.brands.map((cb) => ({
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
          sectorColor: cb.brand.sector?.color || null
        }))
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching collection:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    if (!query.trim()) {
      const [brands, total2] = await Promise.all([
        prisma.brand.findMany({
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: { region: true, sector: true }
        }),
        prisma.brand.count()
      ]);
      return res.json({
        data: brands.map((brand) => ({
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
          sectorColor: brand.sector?.color || null
        })),
        pagination: { page, limit, total: total2, totalPages: Math.ceil(total2 / limit) },
        query
      });
    }
    const searchResults = await prisma.$queryRaw`
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
        b.name ILIKE ${"%" + query + "%"}
        OR b.description_short ILIKE ${"%" + query + "%"}
        OR b.city ILIKE ${"%" + query + "%"}
        OR similarity(b.name, ${query}) > 0.2
        OR similarity(COALESCE(b.description_short, ''), ${query}) > 0.2
      ORDER BY similarity DESC, b.name ASC
      LIMIT ${limit}
      OFFSET ${skip}
    `;
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM brands b
      WHERE 
        b.name ILIKE ${"%" + query + "%"}
        OR b.description_short ILIKE ${"%" + query + "%"}
        OR b.city ILIKE ${"%" + query + "%"}
        OR similarity(b.name, ${query}) > 0.2
        OR similarity(COALESCE(b.description_short, ''), ${query}) > 0.2
    `;
    const total = Number(countResult[0]?.count || 0);
    res.json({
      data: searchResults.map((brand) => ({
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
        sectorColor: brand.sector_color
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      query
    });
  } catch (error) {
    logger.error({ err: error }, "Error searching:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/regions", async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" }
    });
    res.json({ data: regions });
  } catch (error) {
    logger.error({ err: error }, "Error fetching regions:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/regions/with-counts", async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { brands: true }
        }
      }
    });
    res.json({
      data: regions.map((region) => ({
        id: region.id,
        name: region.name,
        slug: region.slug,
        brandCount: region._count.brands
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching regions with counts:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/sectors", async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: "asc" }
    });
    res.json({ data: sectors });
  } catch (error) {
    logger.error({ err: error }, "Error fetching sectors:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/sectors/with-counts", async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { brands: true }
        }
      }
    });
    res.json({
      data: sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        slug: sector.slug,
        color: sector.color,
        icon: sector.icon,
        brandCount: sector._count.brands
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching sectors with counts:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/products", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 24, 100);
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const query = req.query.q || "";
    const sector = req.query.sector || "";
    const sort = req.query.sort || "newest";
    const priceMin = parseFloat(req.query.priceMin) || 0;
    const priceMax = parseFloat(req.query.priceMax) || 0;
    if (query.trim()) {
      const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const like = `%${query}%`;
      const likeNormalized = `%${normalizedQuery}%`;
      const filters = [import_client.Prisma.sql`p.status = 'ACTIVE'`];
      if (sector) filters.push(import_client.Prisma.sql`s.slug = ${sector}`);
      if (priceMin > 0) filters.push(import_client.Prisma.sql`p.price_min >= ${priceMin}`);
      if (priceMax > 0) filters.push(import_client.Prisma.sql`p.price_max <= ${priceMax}`);
      const matches = import_client.Prisma.sql`(
        p.name ILIKE ${like} OR p.name ILIKE ${likeNormalized}
        OR b.name ILIKE ${like} OR b.name ILIKE ${likeNormalized}
        OR similarity(p.name, ${query}) > 0.2
        OR similarity(p.name, ${normalizedQuery}) > 0.2
        OR similarity(b.name, ${query}) > 0.2
        OR similarity(b.name, ${normalizedQuery}) > 0.2
      )`;
      const where2 = import_client.Prisma.sql`${import_client.Prisma.join([...filters, matches], " AND ")}`;
      const orderBy2 = sort === "price-asc" ? import_client.Prisma.sql`p.price_min ASC NULLS LAST` : sort === "price-desc" ? import_client.Prisma.sql`p.price_min DESC NULLS LAST` : sort === "name-asc" ? import_client.Prisma.sql`p.name ASC` : import_client.Prisma.sql`similarity DESC, p.name ASC`;
      const products2 = await prisma.$queryRaw`
        SELECT
          p.id, p.name, p.slug, p.image_url, p.price_min, p.price_max,
          b.name as brand_name, b.slug as brand_slug, s.color as sector_color,
          GREATEST(
            similarity(p.name, ${query}),
            similarity(p.name, ${normalizedQuery}),
            similarity(b.name, ${query}),
            similarity(b.name, ${normalizedQuery})
          ) as similarity
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sectors s ON b.sector_id = s.id
        WHERE ${where2}
        ORDER BY ${orderBy2}
        LIMIT ${limit}
        OFFSET ${skip}
      `;
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sectors s ON b.sector_id = s.id
        WHERE ${where2}
      `;
      const total2 = Number(countResult[0]?.count || 0);
      return res.json({
        data: products2.map((p) => ({
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
        pagination: { page, limit, total: total2, totalPages: Math.ceil(total2 / limit) }
      });
    }
    const where = { status: "ACTIVE" };
    if (sector) {
      where.brand = { sector: { slug: sector } };
    }
    if (priceMin > 0) {
      where.priceMin = { gte: priceMin };
    }
    if (priceMax > 0) {
      where.priceMax = { lte: priceMax };
    }
    let orderBy = { createdAt: "desc" };
    switch (sort) {
      case "price-asc":
        orderBy = { priceMin: "asc" };
        break;
      case "price-desc":
        orderBy = { priceMin: "desc" };
        break;
      case "name-asc":
        orderBy = { name: "asc" };
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
      data: products.map((p) => ({
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
    logger.error({ err: error }, "Error fetching products:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/products/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const trendingProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        isFeatured: true
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        brand: {
          include: {
            sector: true
          }
        }
      }
    });
    let products = trendingProducts;
    if (products.length < limit) {
      const additionalProducts = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: products.map((p) => p.id) }
        },
        take: limit - products.length,
        orderBy: { createdAt: "desc" },
        include: {
          brand: {
            include: {
              sector: true
            }
          }
        }
      });
      products = [...products, ...additionalProducts];
    }
    res.json({
      data: products.map((p) => ({
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
          sectorColor: p.brand.sector?.color || "#002395"
        }
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching trending products:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/products/:slug", async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        slug: req.params.slug,
        status: "ACTIVE"
      },
      include: {
        category: true,
        brand: {
          include: {
            region: true,
            sector: true
          }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ error: "Produit non trouv\xE9" });
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
          sector: product.brand.sector
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching product:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/:slug/products", async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug }
    });
    if (!brand) {
      return res.status(404).json({ error: "Marque non trouv\xE9e" });
    }
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        status: "ACTIVE"
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        category: true
      }
    });
    res.json({
      data: products.map((p) => ({
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
        isFeatured: p.isFeatured
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching brand products:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/brands/:slug/products/all", async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug }
    });
    if (!brand) {
      return res.status(404).json({ error: "Marque non trouv\xE9e" });
    }
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        category: true
      }
    });
    res.json({
      data: products.map((p) => ({
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
        isFeatured: p.isFeatured
      }))
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching all brand products:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/search/all", async (req, res) => {
  try {
    const query = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    if (!query.trim()) {
      return res.json({ brands: [], products: [], query: "" });
    }
    const brands = await prisma.$queryRaw`
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
        b.name ILIKE ${"%" + query + "%"}
        OR b.description_short ILIKE ${"%" + query + "%"}
        OR similarity(b.name, ${query}) > 0.3
      ORDER BY similarity DESC, b.name ASC
      LIMIT ${limit}
    `;
    const products = await prisma.$queryRaw`
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
          p.name ILIKE ${"%" + query + "%"}
          OR p.description_short ILIKE ${"%" + query + "%"}
          OR similarity(p.name, ${query}) > 0.3
        )
      ORDER BY similarity DESC, p.name ASC
      LIMIT ${limit}
    `;
    res.json({
      brands: brands.map((b) => ({
        type: "brand",
        id: b.id,
        name: b.name,
        slug: b.slug,
        description: b.description_short,
        logoUrl: b.logo_url,
        city: b.city,
        sector: b.sector_name,
        sectorSlug: b.sector_slug,
        sectorColor: b.sector_color
      })),
      products: products.map((p) => ({
        type: "product",
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description_short,
        imageUrl: p.image_url,
        priceMin: p.price_min,
        priceMax: p.price_max,
        brandName: p.brand_name,
        brandSlug: p.brand_slug,
        sectorColor: p.sector_color
      })),
      query
    });
  } catch (error) {
    logger.error({ err: error }, "Error in unified search:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
var chatTools = [
  {
    name: "search_products",
    description: "Recherche des produits Made in France dans la base de donn\xE9es. Utilise cet outil quand l'utilisateur cherche des produits, des id\xE9es cadeaux, ou veut acheter quelque chose.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: 'Mots-cl\xE9s de recherche (ex: "pull laine", "chaussures cuir", "chocolat")'
        },
        sector: {
          type: "string",
          enum: ["Mode & Accessoires", "Gastronomie", "Beaut\xE9 & Bien-\xEAtre", "Maison & Jardin", "Sport & Loisirs", "Enfants & Famille", "High-Tech", "Artisanat"],
          description: "Secteur/cat\xE9gorie de produits"
        },
        max_price: {
          type: "number",
          description: "Prix maximum en euros"
        },
        min_price: {
          type: "number",
          description: "Prix minimum en euros"
        },
        target: {
          type: "string",
          enum: ["homme", "femme", "enfant", "mixte"],
          description: "Public cible du produit"
        },
        limit: {
          type: "number",
          description: "Nombre de r\xE9sultats (d\xE9faut: 8, max: 12)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_brands",
    description: "Recherche des marques fran\xE7aises dans la base de donn\xE9es. Utilise cet outil quand l'utilisateur cherche des marques, des fabricants, ou veut d\xE9couvrir des entreprises fran\xE7aises.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: 'Mots-cl\xE9s de recherche (ex: "pull", "chocolatier", "cosm\xE9tique bio")'
        },
        sector: {
          type: "string",
          enum: ["Mode & Accessoires", "Gastronomie", "Beaut\xE9 & Bien-\xEAtre", "Maison & Jardin", "Sport & Loisirs", "Enfants & Famille", "High-Tech", "Artisanat"],
          description: "Secteur d'activit\xE9 de la marque"
        },
        region: {
          type: "string",
          description: 'R\xE9gion fran\xE7aise (ex: "Bretagne", "Normandie")'
        },
        limit: {
          type: "number",
          description: "Nombre de r\xE9sultats (d\xE9faut: 6, max: 12)"
        }
      },
      required: ["query"]
    }
  }
];
async function executeSearchProducts(params) {
  const limit = Math.min(params.limit || 32, 40);
  const sector = params.sector?.replace(/&amp;/g, "&");
  const conditions = [
    import_client.Prisma.sql`p.status = 'ACTIVE'`,
    import_client.Prisma.sql`p.price_min > 0`,
    import_client.Prisma.sql`p.price_min IS NOT NULL`,
    import_client.Prisma.sql`p.image_url IS NOT NULL`
  ];
  if (params.max_price) conditions.push(import_client.Prisma.sql`p.price_min <= ${params.max_price}`);
  if (params.min_price) conditions.push(import_client.Prisma.sql`p.price_min >= ${params.min_price}`);
  if (sector) conditions.push(import_client.Prisma.sql`s.name = ${sector}`);
  if (params.target) {
    conditions.push(import_client.Prisma.sql`(
      p.attributes->>'target' = ${params.target}
      OR p.attributes->>'target' = 'mixte'
      OR p.attributes->>'target' IS NULL
    )`);
  }
  const keywords = (params.query || "").toLowerCase().split(/\s+/).filter((k) => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map((k) => {
      const like = `%${k}%`;
      return import_client.Prisma.sql`(
        p.name ILIKE ${like}
        OR p.tags::text ILIKE ${like}
        OR p.materials::text ILIKE ${like}
        OR p.description_short ILIKE ${like}
        OR b.name ILIKE ${like}
      )`;
    });
    conditions.push(import_client.Prisma.sql`(${import_client.Prisma.join(keywordConditions, " AND ")})`);
  }
  const where = import_client.Prisma.join(conditions, " AND ");
  try {
    const products = await prisma.$queryRaw`
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
    logger.error({ err: e }, "Search products error:");
    return [];
  }
}
async function executeSearchBrands(params) {
  const limit = Math.min(params.limit || 8, 12);
  const sector = params.sector?.replace(/&amp;/g, "&");
  const conditions = [import_client.Prisma.sql`b.status = 'ACTIVE'`];
  if (sector) conditions.push(import_client.Prisma.sql`s.name = ${sector}`);
  if (params.region) conditions.push(import_client.Prisma.sql`r.name ILIKE ${`%${params.region}%`}`);
  const keywords = (params.query || "").toLowerCase().split(/\s+/).filter((k) => k.length > 2);
  if (keywords.length > 0) {
    const keywordConditions = keywords.map((k) => {
      const like = `%${k}%`;
      return import_client.Prisma.sql`(
        b.name ILIKE ${like}
        OR b.description_short ILIKE ${like}
        OR s.name ILIKE ${like}
        OR (b.ai_generated_content->>'tags')::text ILIKE ${like}
      )`;
    });
    conditions.push(import_client.Prisma.sql`(${import_client.Prisma.join(keywordConditions, " OR ")})`);
  }
  const where = import_client.Prisma.join(conditions, " AND ");
  const firstKeyword = `%${keywords[0] ?? ""}%`;
  try {
    const brands = await prisma.$queryRaw`
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
    return brands;
  } catch (e) {
    logger.error({ err: e }, "Search brands error:");
    return [];
  }
}
var CHAT_SYSTEM_PROMPT = `Tu es un personal shopper Made in France \u{1F1EB}\u{1F1F7}

R\xC8GLE ABSOLUE : \xC0 CHAQUE MESSAGE, tu DOIS appeler au moins un outil de recherche.
- Si l'utilisateur cherche des PRODUITS \u2192 appelle search_products
- Si l'utilisateur cherche des MARQUES/ENTREPRISES \u2192 appelle search_brands
- Si c'est ambigu \u2192 appelle LES DEUX pour montrer produits ET marques

QUAND UTILISER search_brands :
- "marques de pull", "entreprises fran\xE7aises", "qui fabrique des...", "d\xE9couvrir des marques"
- "marques bretonnes", "fabricants de...", "artisans qui font..."

QUAND UTILISER search_products :
- "je cherche un pull", "cadeau pour...", "produit moins de 50\u20AC"

QUAND UTILISER LES DEUX :
- "je cherche des pulls" \u2192 search_products(query="pull") + search_brands(query="pull", sector="Mode & Accessoires")
- \xC7a permet de montrer des produits ET les marques qui les fabriquent

Base de donn\xE9es : 902 marques fran\xE7aises, ~40 000 produits
Secteurs : Mode & Accessoires, Gastronomie, Beaut\xE9 & Bien-\xEAtre, Maison & Jardin, Sport & Loisirs, Enfants & Famille, High-Tech, Artisanat

PROCESSUS \xC0 CHAQUE MESSAGE :
1. APPELLE le(s) bon(s) outil(s) avec limit=12
2. Pr\xE9sente les r\xE9sultats en 1-2 phrases
3. Pose UNE question pour affiner
4. Propose 4 suggestions (crit\xE8res, JAMAIS des noms de produits/marques)

SUGGESTIONS = CRIT\xC8RES D'AFFINAGE :
- Pour QUI : "Pour homme|Pour femme|Pour enfant|C'est un cadeau"
- BUDGET : "Moins de 50\u20AC|Entre 50 et 100\u20AC|Plus de 100\u20AC|Peu importe"
- STYLE : "Style classique|Style moderne|En laine|En coton"
- D\xC9COUVERTE : "Voir les marques|Produits artisanaux|Made in Bretagne|Nouveaut\xE9s"

FORMAT DE FIN OBLIGATOIRE :
[SUGGESTIONS]
crit\xE8re1|crit\xE8re2|crit\xE8re3|crit\xE8re4
[/SUGGESTIONS]

STYLE : Tutoiement, 1-2 phrases max, emojis avec parcimonie (\u{1F1EB}\u{1F1F7} \u2728).

INTERDIT : Inventer des produits/marques ou proposer des noms en suggestion.`;
app.post("/api/v1/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message requis" });
    }
    let aiSettings = null;
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: "ai_settings" }
      });
      if (setting) {
        aiSettings = setting.value;
      }
    } catch (e) {
    }
    const model = aiSettings?.model || process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
    const systemPrompt = aiSettings?.prompt || CHAT_SYSTEM_PROMPT;
    const temperature = aiSettings?.temperature || 0.7;
    const maxTokens = aiSettings?.maxTokens || 1024;
    const rules = aiSettings?.rules || [];
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
    const isOpenAI = model.startsWith("gpt-");
    if (isOpenAI) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return res.status(400).json({ error: "Cl\xE9 OpenAI non configur\xE9e" });
      }
      return res.status(400).json({ error: "OpenAI pas encore impl\xE9ment\xE9 avec tool use. Utilisez Claude." });
    }
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return res.status(400).json({ error: "Cl\xE9 Anthropic non configur\xE9e" });
    }
    const anthropicClient = new import_sdk.default({ apiKey: anthropicKey });
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ];
    let response = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: chatTools,
      messages
    });
    logger.debug({ stopReason: response.stop_reason, model }, "reponse du modele");
    let relevantProducts = [];
    let relevantBrands = [];
    while (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find(
        (block) => block.type === "tool_use"
      );
      if (!toolUseBlock) break;
      logger.debug({ tool: toolUseBlock.name }, "appel d outil");
      let toolResult;
      if (toolUseBlock.name === "search_products") {
        const products = await executeSearchProducts(toolUseBlock.input);
        relevantProducts = products;
        toolResult = products.length > 0 ? `Trouv\xE9 ${products.length} produits: ${products.map((p) => `${p.name} (${p.brand_name}) - ${p.price_min}\u20AC`).join(", ")}` : "Aucun produit trouv\xE9";
      } else if (toolUseBlock.name === "search_brands") {
        const brands = await executeSearchBrands(toolUseBlock.input);
        relevantBrands = brands;
        toolResult = brands.length > 0 ? `Trouv\xE9 ${brands.length} marques: ${brands.map((b) => `${b.name} (${b.sector_name || "N/A"})`).join(", ")}` : "Aucune marque trouv\xE9e";
      } else {
        toolResult = "Outil inconnu";
      }
      messages.push({
        role: "assistant",
        content: response.content
      });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: toolResult
          }
        ]
      });
      response = await anthropicClient.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools: chatTools,
        messages
      });
    }
    const textBlock = response.content.find(
      (block) => block.type === "text"
    );
    const finalMessage = textBlock?.text || "Je n'ai pas pu g\xE9n\xE9rer de r\xE9ponse.";
    const formattedProducts = relevantProducts.map((p) => ({
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
      sectorColor: p.sector_color
    }));
    const formattedBrands = relevantBrands.map((b) => ({
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
      productCount: Number(b.product_count) || 0
    }));
    res.json({
      message: finalMessage,
      products: formattedProducts,
      brands: formattedBrands
    });
  } catch (error) {
    logger.error({ err: error }, "\u274C Chat error:");
    res.status(500).json({ error: "Erreur du chat IA" });
  }
});
app.get("/api/v1/labels", async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      orderBy: { name: "asc" }
    });
    res.json({ data: labels });
  } catch (error) {
    logger.error({ err: error }, "Get labels error:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/api/v1/products/:id/labels", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        labels: {
          include: {
            label: true
          }
        }
      }
    });
    if (!product) {
      return res.status(404).json({ error: "Produit non trouv\xE9" });
    }
    const labels = product.labels.map((pl) => pl.label);
    res.json({ data: labels });
  } catch (error) {
    logger.error({ err: error }, "Get product labels error:");
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.post("/api/v1/stripe/webhook", import_express.default.raw({ type: "application/json" }), async (req, res) => {
  const stripe = stripeClient();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("[stripe] STRIPE_WEBHOOK_SECRET absent : webhook refuse.");
    return res.status(500).send("Webhook non configure");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error({ err: err.message }, "[stripe] signature du webhook invalide:");
    return res.status(400).send("Signature invalide");
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { brandId, plan } = session.metadata || {};
      if (brandId && plan) {
        await prisma.brand.update({
          where: { id: brandId },
          data: {
            subscriptionTier: plan,
            stripeSubscriptionId: session.subscription
          }
        });
        logger.info({ brandId, plan }, "abonnement active");
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const brand = await prisma.brand.findFirst({
        where: { stripeSubscriptionId: subscription.id }
      });
      if (brand) {
        const isActive = subscription.status === "active";
        if (!isActive) {
          await prisma.brand.update({
            where: { id: brand.id },
            data: { subscriptionTier: "FREE" }
          });
          logger.info({ brandId: brand.id }, "abonnement inactif, retour au palier gratuit");
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const brand = await prisma.brand.findFirst({
        where: { stripeSubscriptionId: subscription.id }
      });
      if (brand) {
        await prisma.brand.update({
          where: { id: brand.id },
          data: {
            subscriptionTier: "FREE",
            stripeSubscriptionId: null
          }
        });
        logger.info({ brandId: brand.id }, "abonnement resilie, retour au palier gratuit");
      }
      break;
    }
  }
  res.json({ received: true });
});
app.use((err, req, res, _next) => {
  logger.error({ err, method: req.method, path: req.path }, "erreur non geree");
  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur serveur" });
});
app.use((req, res) => {
  res.status(404).json({ error: "Route inconnue" });
});
app.listen(PORT, () => {
  logger.info({ port: PORT }, "API demarree");
});
