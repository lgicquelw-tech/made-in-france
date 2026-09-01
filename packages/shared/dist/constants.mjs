// src/constants/index.ts
var MADE_IN_FRANCE_LABELS = {
  FABRICATION_100_FRANCE: "100% Fabriqu\xE9 en France",
  ASSEMBLE_FRANCE: "Assembl\xE9 en France",
  CONCU_FRANCE: "Con\xE7u en France",
  MATIERE_FRANCE: "Mati\xE8res premi\xE8res fran\xE7aises",
  ENTREPRISE_FRANCAISE: "Entreprise fran\xE7aise",
  MIXTE: "Mixte (selon les produits)"
};
var MADE_IN_FRANCE_COLORS = {
  FABRICATION_100_FRANCE: "#0055A4",
  // Bleu France
  ASSEMBLE_FRANCE: "#22C55E",
  CONCU_FRANCE: "#3B82F6",
  MATIERE_FRANCE: "#8B5CF6",
  ENTREPRISE_FRANCAISE: "#F59E0B",
  MIXTE: "#6B7280"
};
var SECTOR_ICONS = {
  mode: "shirt",
  maison: "home",
  gastronomie: "utensils",
  cosmetiques: "sparkles",
  enfants: "baby",
  "high-tech": "laptop",
  "sport-loisirs": "dumbbell",
  "jardin-exterieur": "flower",
  artisanat: "hammer"
};
var SECTOR_COLORS = {
  mode: "#8B5CF6",
  maison: "#F59E0B",
  gastronomie: "#EF4444",
  cosmetiques: "#EC4899",
  enfants: "#06B6D4",
  "high-tech": "#3B82F6",
  "sport-loisirs": "#22C55E",
  "jardin-exterieur": "#84CC16",
  artisanat: "#A16207"
};
var REGION_CENTERS = {
  bretagne: { lat: 48.202, lng: -2.9326 },
  normandie: { lat: 49.1829, lng: -0.3707 },
  "ile-de-france": { lat: 48.8566, lng: 2.3522 },
  "provence-alpes-cote-dazur": { lat: 43.9352, lng: 6.0679 },
  "auvergne-rhone-alpes": { lat: 45.4473, lng: 4.3859 },
  "nouvelle-aquitaine": { lat: 45.7086, lng: 0.6262 },
  occitanie: { lat: 43.8927, lng: 3.2828 },
  "hauts-de-france": { lat: 49.9662, lng: 2.7954 },
  "grand-est": { lat: 48.6998, lng: 6.1878 },
  "pays-de-la-loire": { lat: 47.4784, lng: -0.5632 },
  "centre-val-de-loire": { lat: 47.7516, lng: 1.6751 },
  "bourgogne-franche-comte": { lat: 47.2805, lng: 4.9994 },
  corse: { lat: 42.0396, lng: 9.0129 }
};
var FRANCE_BOUNDS = {
  north: 51.1,
  south: 41.3,
  west: -5.2,
  east: 9.6
};
var FRANCE_CENTER = {
  lat: 46.603354,
  lng: 1.888334
};
var DEFAULT_PAGE_SIZE = 20;
var MAX_PAGE_SIZE = 100;
var PRICE_RANGES = [
  { label: "Moins de 25 \u20AC", min: 0, max: 25 },
  { label: "25 - 50 \u20AC", min: 25, max: 50 },
  { label: "50 - 100 \u20AC", min: 50, max: 100 },
  { label: "100 - 200 \u20AC", min: 100, max: 200 },
  { label: "Plus de 200 \u20AC", min: 200, max: null }
];
var COMMON_TAGS = [
  "\xE9co-responsable",
  "bio",
  "vegan",
  "naturel",
  "luxe",
  "premium",
  "accessible",
  "entr\xE9e de gamme",
  "fait-main",
  "artisanal",
  "traditionnel",
  "local",
  "circuit-court",
  "homme",
  "femme",
  "mixte",
  "enfant"
];
var AI_INTENT_LABELS = {
  gift: "Recherche de cadeau",
  self_purchase: "Achat personnel",
  discovery: "D\xE9couverte",
  comparison: "Comparaison",
  local_search: "Recherche locale",
  question: "Question"
};
var SUBSCRIPTION_LIMITS = {
  FREE: {
    maxProducts: 5,
    maxTeamMembers: 1,
    hasAnalytics: false,
    hasAdvancedAnalytics: false,
    hasCampaigns: false,
    hasApiAccess: false
  },
  STARTER: {
    maxProducts: 25,
    maxTeamMembers: 2,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasCampaigns: false,
    hasApiAccess: false
  },
  STANDARD: {
    maxProducts: 100,
    maxTeamMembers: 5,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasCampaigns: true,
    hasApiAccess: false
  },
  PREMIUM: {
    maxProducts: Infinity,
    maxTeamMembers: Infinity,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasCampaigns: true,
    hasApiAccess: true
  }
};
var API_ROUTES = {
  // Public
  SEARCH: "/api/v1/search",
  SEARCH_AI: "/api/v1/search/ai",
  SEARCH_SUGGEST: "/api/v1/search/suggest",
  BRANDS: "/api/v1/brands",
  BRAND: (slug) => `/api/v1/brands/${slug}`,
  BRAND_PRODUCTS: (slug) => `/api/v1/brands/${slug}/products`,
  BRANDS_FEATURED: "/api/v1/brands/featured",
  BRANDS_NEARBY: "/api/v1/brands/nearby",
  PRODUCTS: "/api/v1/products",
  PRODUCT: (id) => `/api/v1/products/${id}`,
  PRODUCTS_FEATURED: "/api/v1/products/featured",
  MAP_BRANDS: "/api/v1/map/brands",
  MAP_CLUSTERS: "/api/v1/map/clusters",
  SECTORS: "/api/v1/sectors",
  CATEGORIES: "/api/v1/categories",
  REGIONS: "/api/v1/regions",
  LABELS: "/api/v1/labels",
  EVENTS: "/api/v1/events",
  // Auth
  AUTH_REGISTER: "/api/v1/auth/register",
  AUTH_LOGIN: "/api/v1/auth/login",
  AUTH_LOGOUT: "/api/v1/auth/logout",
  AUTH_OAUTH: "/api/v1/auth/oauth",
  // User
  ME: "/api/v1/me",
  MY_FAVORITES: "/api/v1/me/favorites",
  MY_RECOMMENDATIONS: "/api/v1/me/recommendations",
  // Brand (B2B)
  BRAND_PROFILE: "/api/v1/brand/profile",
  BRAND_PRODUCTS_MANAGE: "/api/v1/brand/products",
  BRAND_ANALYTICS: "/api/v1/brand/analytics",
  BRAND_CAMPAIGNS: "/api/v1/brand/campaigns",
  BRAND_SUBSCRIPTION: "/api/v1/brand/subscription",
  BRAND_AI_GENERATE: "/api/v1/brand/ai/generate",
  // Admin
  ADMIN_BRANDS: "/api/v1/admin/brands",
  ADMIN_IMPORT: "/api/v1/admin/import/brands",
  ADMIN_ANALYTICS: "/api/v1/admin/analytics"
};
var VALIDATION = {
  BRAND_NAME_MIN: 2,
  BRAND_NAME_MAX: 200,
  BRAND_TAGLINE_MAX: 300,
  BRAND_DESCRIPTION_SHORT_MAX: 500,
  BRAND_DESCRIPTION_LONG_MAX: 5e3,
  PRODUCT_NAME_MIN: 2,
  PRODUCT_NAME_MAX: 300,
  PRODUCT_DESCRIPTION_SHORT_MAX: 500,
  PRODUCT_DESCRIPTION_LONG_MAX: 5e3,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  EMAIL_MAX: 255,
  SEO_TITLE_MAX: 70,
  SEO_DESCRIPTION_MAX: 160,
  URL_MAX: 500
};
export {
  AI_INTENT_LABELS,
  API_ROUTES,
  COMMON_TAGS,
  DEFAULT_PAGE_SIZE,
  FRANCE_BOUNDS,
  FRANCE_CENTER,
  MADE_IN_FRANCE_COLORS,
  MADE_IN_FRANCE_LABELS,
  MAX_PAGE_SIZE,
  PRICE_RANGES,
  REGION_CENTERS,
  SECTOR_COLORS,
  SECTOR_ICONS,
  SUBSCRIPTION_LIMITS,
  VALIDATION
};
//# sourceMappingURL=constants.mjs.map