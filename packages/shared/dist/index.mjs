// src/types/index.ts
var MadeInFranceLevel = /* @__PURE__ */ ((MadeInFranceLevel2) => {
  MadeInFranceLevel2["FABRICATION_100_FRANCE"] = "FABRICATION_100_FRANCE";
  MadeInFranceLevel2["ASSEMBLE_FRANCE"] = "ASSEMBLE_FRANCE";
  MadeInFranceLevel2["CONCU_FRANCE"] = "CONCU_FRANCE";
  MadeInFranceLevel2["MATIERE_FRANCE"] = "MATIERE_FRANCE";
  MadeInFranceLevel2["ENTREPRISE_FRANCAISE"] = "ENTREPRISE_FRANCAISE";
  MadeInFranceLevel2["MIXTE"] = "MIXTE";
  return MadeInFranceLevel2;
})(MadeInFranceLevel || {});
var BrandStatus = /* @__PURE__ */ ((BrandStatus2) => {
  BrandStatus2["DRAFT"] = "DRAFT";
  BrandStatus2["PENDING_REVIEW"] = "PENDING_REVIEW";
  BrandStatus2["ACTIVE"] = "ACTIVE";
  BrandStatus2["SUSPENDED"] = "SUSPENDED";
  BrandStatus2["REJECTED"] = "REJECTED";
  return BrandStatus2;
})(BrandStatus || {});
var ProductStatus = /* @__PURE__ */ ((ProductStatus2) => {
  ProductStatus2["DRAFT"] = "DRAFT";
  ProductStatus2["ACTIVE"] = "ACTIVE";
  ProductStatus2["OUT_OF_STOCK"] = "OUT_OF_STOCK";
  ProductStatus2["DISCONTINUED"] = "DISCONTINUED";
  return ProductStatus2;
})(ProductStatus || {});
var SubscriptionTier = /* @__PURE__ */ ((SubscriptionTier2) => {
  SubscriptionTier2["FREE"] = "FREE";
  SubscriptionTier2["STARTER"] = "STARTER";
  SubscriptionTier2["STANDARD"] = "STANDARD";
  SubscriptionTier2["PREMIUM"] = "PREMIUM";
  return SubscriptionTier2;
})(SubscriptionTier || {});
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["CONSUMER"] = "CONSUMER";
  UserRole2["BRAND_OWNER"] = "BRAND_OWNER";
  UserRole2["BRAND_MANAGER"] = "BRAND_MANAGER";
  UserRole2["ADMIN"] = "ADMIN";
  UserRole2["SUPER_ADMIN"] = "SUPER_ADMIN";
  return UserRole2;
})(UserRole || {});
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["BRAND_PAGE_VIEW"] = "BRAND_PAGE_VIEW";
  EventType2["PRODUCT_PAGE_VIEW"] = "PRODUCT_PAGE_VIEW";
  EventType2["SEARCH_RESULTS_VIEW"] = "SEARCH_RESULTS_VIEW";
  EventType2["SEARCH_QUERY"] = "SEARCH_QUERY";
  EventType2["FILTER_APPLIED"] = "FILTER_APPLIED";
  EventType2["MAP_INTERACTION"] = "MAP_INTERACTION";
  EventType2["CLICK_OUT"] = "CLICK_OUT";
  EventType2["AFFILIATE_CLICK"] = "AFFILIATE_CLICK";
  EventType2["ADD_TO_FAVORITES"] = "ADD_TO_FAVORITES";
  EventType2["AI_CONVERSATION"] = "AI_CONVERSATION";
  EventType2["AI_RECOMMENDATION_SHOWN"] = "AI_RECOMMENDATION_SHOWN";
  EventType2["AI_RECOMMENDATION_CLICKED"] = "AI_RECOMMENDATION_CLICKED";
  return EventType2;
})(EventType || {});

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

// src/utils/index.ts
function slugify(text) {
  return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
function formatPriceRange(min, max, currency = "EUR") {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  if (min != null && max != null) {
    if (min === max) {
      return formatter.format(min);
    }
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min != null) {
    return `\xC0 partir de ${formatter.format(min)}`;
  }
  if (max != null) {
    return `Jusqu'\xE0 ${formatter.format(max)}`;
  }
  return "Prix non communiqu\xE9";
}
function formatPrice(price, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}
function formatNumber(num) {
  return new Intl.NumberFormat("fr-FR").format(num);
}
function formatDate(date, options = {
  year: "numeric",
  month: "long",
  day: "numeric"
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", options).format(d);
}
function formatRelativeDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1e3 * 60));
      if (diffMinutes === 0) {
        return "\xC0 l'instant";
      }
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }
  if (diffDays === 1) {
    return "Hier";
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
}
function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRad(deg) {
  return deg * (Math.PI / 180);
}
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1e3)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl, "http://placeholder.com");
  Object.entries(params).forEach(([key, value]) => {
    if (value === void 0) return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  return url.pathname + url.search;
}
function parseQueryParams(url) {
  const searchParams = new URLSearchParams(url.split("?")[1] || "");
  const params = {};
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  return params;
}
export {
  AI_INTENT_LABELS,
  API_ROUTES,
  BrandStatus,
  COMMON_TAGS,
  DEFAULT_PAGE_SIZE,
  EventType,
  FRANCE_BOUNDS,
  FRANCE_CENTER,
  MADE_IN_FRANCE_COLORS,
  MADE_IN_FRANCE_LABELS,
  MAX_PAGE_SIZE,
  MadeInFranceLevel,
  PRICE_RANGES,
  ProductStatus,
  REGION_CENTERS,
  SECTOR_COLORS,
  SECTOR_ICONS,
  SUBSCRIPTION_LIMITS,
  SubscriptionTier,
  UserRole,
  VALIDATION,
  buildUrl,
  calculateDistance,
  capitalize,
  debounce,
  deepClone,
  formatDate,
  formatDistance,
  formatNumber,
  formatPrice,
  formatPriceRange,
  formatRelativeDate,
  generateId,
  isEmpty,
  parseQueryParams,
  slugify,
  throttle,
  truncate
};
//# sourceMappingURL=index.mjs.map