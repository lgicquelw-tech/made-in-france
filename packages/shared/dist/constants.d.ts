declare const MADE_IN_FRANCE_LABELS: {
    readonly FABRICATION_100_FRANCE: "100% Fabriqué en France";
    readonly ASSEMBLE_FRANCE: "Assemblé en France";
    readonly CONCU_FRANCE: "Conçu en France";
    readonly MATIERE_FRANCE: "Matières premières françaises";
    readonly ENTREPRISE_FRANCAISE: "Entreprise française";
    readonly MIXTE: "Mixte (selon les produits)";
};
declare const MADE_IN_FRANCE_COLORS: {
    readonly FABRICATION_100_FRANCE: "#0055A4";
    readonly ASSEMBLE_FRANCE: "#22C55E";
    readonly CONCU_FRANCE: "#3B82F6";
    readonly MATIERE_FRANCE: "#8B5CF6";
    readonly ENTREPRISE_FRANCAISE: "#F59E0B";
    readonly MIXTE: "#6B7280";
};
declare const SECTOR_ICONS: {
    readonly mode: "shirt";
    readonly maison: "home";
    readonly gastronomie: "utensils";
    readonly cosmetiques: "sparkles";
    readonly enfants: "baby";
    readonly 'high-tech': "laptop";
    readonly 'sport-loisirs': "dumbbell";
    readonly 'jardin-exterieur': "flower";
    readonly artisanat: "hammer";
};
declare const SECTOR_COLORS: {
    readonly mode: "#8B5CF6";
    readonly maison: "#F59E0B";
    readonly gastronomie: "#EF4444";
    readonly cosmetiques: "#EC4899";
    readonly enfants: "#06B6D4";
    readonly 'high-tech': "#3B82F6";
    readonly 'sport-loisirs': "#22C55E";
    readonly 'jardin-exterieur': "#84CC16";
    readonly artisanat: "#A16207";
};
declare const REGION_CENTERS: {
    readonly bretagne: {
        readonly lat: 48.202;
        readonly lng: -2.9326;
    };
    readonly normandie: {
        readonly lat: 49.1829;
        readonly lng: -0.3707;
    };
    readonly 'ile-de-france': {
        readonly lat: 48.8566;
        readonly lng: 2.3522;
    };
    readonly 'provence-alpes-cote-dazur': {
        readonly lat: 43.9352;
        readonly lng: 6.0679;
    };
    readonly 'auvergne-rhone-alpes': {
        readonly lat: 45.4473;
        readonly lng: 4.3859;
    };
    readonly 'nouvelle-aquitaine': {
        readonly lat: 45.7086;
        readonly lng: 0.6262;
    };
    readonly occitanie: {
        readonly lat: 43.8927;
        readonly lng: 3.2828;
    };
    readonly 'hauts-de-france': {
        readonly lat: 49.9662;
        readonly lng: 2.7954;
    };
    readonly 'grand-est': {
        readonly lat: 48.6998;
        readonly lng: 6.1878;
    };
    readonly 'pays-de-la-loire': {
        readonly lat: 47.4784;
        readonly lng: -0.5632;
    };
    readonly 'centre-val-de-loire': {
        readonly lat: 47.7516;
        readonly lng: 1.6751;
    };
    readonly 'bourgogne-franche-comte': {
        readonly lat: 47.2805;
        readonly lng: 4.9994;
    };
    readonly corse: {
        readonly lat: 42.0396;
        readonly lng: 9.0129;
    };
};
declare const FRANCE_BOUNDS: {
    readonly north: 51.1;
    readonly south: 41.3;
    readonly west: -5.2;
    readonly east: 9.6;
};
declare const FRANCE_CENTER: {
    readonly lat: 46.603354;
    readonly lng: 1.888334;
};
declare const DEFAULT_PAGE_SIZE = 20;
declare const MAX_PAGE_SIZE = 100;
declare const PRICE_RANGES: readonly [{
    readonly label: "Moins de 25 €";
    readonly min: 0;
    readonly max: 25;
}, {
    readonly label: "25 - 50 €";
    readonly min: 25;
    readonly max: 50;
}, {
    readonly label: "50 - 100 €";
    readonly min: 50;
    readonly max: 100;
}, {
    readonly label: "100 - 200 €";
    readonly min: 100;
    readonly max: 200;
}, {
    readonly label: "Plus de 200 €";
    readonly min: 200;
    readonly max: null;
}];
declare const COMMON_TAGS: readonly ["éco-responsable", "bio", "vegan", "naturel", "luxe", "premium", "accessible", "entrée de gamme", "fait-main", "artisanal", "traditionnel", "local", "circuit-court", "homme", "femme", "mixte", "enfant"];
declare const AI_INTENT_LABELS: {
    readonly gift: "Recherche de cadeau";
    readonly self_purchase: "Achat personnel";
    readonly discovery: "Découverte";
    readonly comparison: "Comparaison";
    readonly local_search: "Recherche locale";
    readonly question: "Question";
};
declare const SUBSCRIPTION_LIMITS: {
    readonly FREE: {
        readonly maxProducts: 5;
        readonly maxTeamMembers: 1;
        readonly hasAnalytics: false;
        readonly hasAdvancedAnalytics: false;
        readonly hasCampaigns: false;
        readonly hasApiAccess: false;
    };
    readonly STARTER: {
        readonly maxProducts: 25;
        readonly maxTeamMembers: 2;
        readonly hasAnalytics: true;
        readonly hasAdvancedAnalytics: false;
        readonly hasCampaigns: false;
        readonly hasApiAccess: false;
    };
    readonly STANDARD: {
        readonly maxProducts: 100;
        readonly maxTeamMembers: 5;
        readonly hasAnalytics: true;
        readonly hasAdvancedAnalytics: true;
        readonly hasCampaigns: true;
        readonly hasApiAccess: false;
    };
    readonly PREMIUM: {
        readonly maxProducts: number;
        readonly maxTeamMembers: number;
        readonly hasAnalytics: true;
        readonly hasAdvancedAnalytics: true;
        readonly hasCampaigns: true;
        readonly hasApiAccess: true;
    };
};
declare const API_ROUTES: {
    readonly SEARCH: "/api/v1/search";
    readonly SEARCH_AI: "/api/v1/search/ai";
    readonly SEARCH_SUGGEST: "/api/v1/search/suggest";
    readonly BRANDS: "/api/v1/brands";
    readonly BRAND: (slug: string) => string;
    readonly BRAND_PRODUCTS: (slug: string) => string;
    readonly BRANDS_FEATURED: "/api/v1/brands/featured";
    readonly BRANDS_NEARBY: "/api/v1/brands/nearby";
    readonly PRODUCTS: "/api/v1/products";
    readonly PRODUCT: (id: string) => string;
    readonly PRODUCTS_FEATURED: "/api/v1/products/featured";
    readonly MAP_BRANDS: "/api/v1/map/brands";
    readonly MAP_CLUSTERS: "/api/v1/map/clusters";
    readonly SECTORS: "/api/v1/sectors";
    readonly CATEGORIES: "/api/v1/categories";
    readonly REGIONS: "/api/v1/regions";
    readonly LABELS: "/api/v1/labels";
    readonly EVENTS: "/api/v1/events";
    readonly AUTH_REGISTER: "/api/v1/auth/register";
    readonly AUTH_LOGIN: "/api/v1/auth/login";
    readonly AUTH_LOGOUT: "/api/v1/auth/logout";
    readonly AUTH_OAUTH: "/api/v1/auth/oauth";
    readonly ME: "/api/v1/me";
    readonly MY_FAVORITES: "/api/v1/me/favorites";
    readonly MY_RECOMMENDATIONS: "/api/v1/me/recommendations";
    readonly BRAND_PROFILE: "/api/v1/brand/profile";
    readonly BRAND_PRODUCTS_MANAGE: "/api/v1/brand/products";
    readonly BRAND_ANALYTICS: "/api/v1/brand/analytics";
    readonly BRAND_CAMPAIGNS: "/api/v1/brand/campaigns";
    readonly BRAND_SUBSCRIPTION: "/api/v1/brand/subscription";
    readonly BRAND_AI_GENERATE: "/api/v1/brand/ai/generate";
    readonly ADMIN_BRANDS: "/api/v1/admin/brands";
    readonly ADMIN_IMPORT: "/api/v1/admin/import/brands";
    readonly ADMIN_ANALYTICS: "/api/v1/admin/analytics";
};
declare const VALIDATION: {
    readonly BRAND_NAME_MIN: 2;
    readonly BRAND_NAME_MAX: 200;
    readonly BRAND_TAGLINE_MAX: 300;
    readonly BRAND_DESCRIPTION_SHORT_MAX: 500;
    readonly BRAND_DESCRIPTION_LONG_MAX: 5000;
    readonly PRODUCT_NAME_MIN: 2;
    readonly PRODUCT_NAME_MAX: 300;
    readonly PRODUCT_DESCRIPTION_SHORT_MAX: 500;
    readonly PRODUCT_DESCRIPTION_LONG_MAX: 5000;
    readonly PASSWORD_MIN: 8;
    readonly PASSWORD_MAX: 100;
    readonly EMAIL_MAX: 255;
    readonly SEO_TITLE_MAX: 70;
    readonly SEO_DESCRIPTION_MAX: 160;
    readonly URL_MAX: 500;
};

export { AI_INTENT_LABELS, API_ROUTES, COMMON_TAGS, DEFAULT_PAGE_SIZE, FRANCE_BOUNDS, FRANCE_CENTER, MADE_IN_FRANCE_COLORS, MADE_IN_FRANCE_LABELS, MAX_PAGE_SIZE, PRICE_RANGES, REGION_CENTERS, SECTOR_COLORS, SECTOR_ICONS, SUBSCRIPTION_LIMITS, VALIDATION };
