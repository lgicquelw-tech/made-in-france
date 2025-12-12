declare enum MadeInFranceLevel {
    FABRICATION_100_FRANCE = "FABRICATION_100_FRANCE",
    ASSEMBLE_FRANCE = "ASSEMBLE_FRANCE",
    CONCU_FRANCE = "CONCU_FRANCE",
    MATIERE_FRANCE = "MATIERE_FRANCE",
    ENTREPRISE_FRANCAISE = "ENTREPRISE_FRANCAISE",
    MIXTE = "MIXTE"
}
declare enum BrandStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    REJECTED = "REJECTED"
}
declare enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    OUT_OF_STOCK = "OUT_OF_STOCK",
    DISCONTINUED = "DISCONTINUED"
}
declare enum SubscriptionTier {
    FREE = "FREE",
    STARTER = "STARTER",
    STANDARD = "STANDARD",
    PREMIUM = "PREMIUM"
}
declare enum UserRole {
    CONSUMER = "CONSUMER",
    BRAND_OWNER = "BRAND_OWNER",
    BRAND_MANAGER = "BRAND_MANAGER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
declare enum EventType {
    BRAND_PAGE_VIEW = "BRAND_PAGE_VIEW",
    PRODUCT_PAGE_VIEW = "PRODUCT_PAGE_VIEW",
    SEARCH_RESULTS_VIEW = "SEARCH_RESULTS_VIEW",
    SEARCH_QUERY = "SEARCH_QUERY",
    FILTER_APPLIED = "FILTER_APPLIED",
    MAP_INTERACTION = "MAP_INTERACTION",
    CLICK_OUT = "CLICK_OUT",
    AFFILIATE_CLICK = "AFFILIATE_CLICK",
    ADD_TO_FAVORITES = "ADD_TO_FAVORITES",
    AI_CONVERSATION = "AI_CONVERSATION",
    AI_RECOMMENDATION_SHOWN = "AI_RECOMMENDATION_SHOWN",
    AI_RECOMMENDATION_CLICKED = "AI_RECOMMENDATION_CLICKED"
}
interface Region {
    id: string;
    name: string;
    slug: string;
    centerLat?: number;
    centerLng?: number;
}
interface Department {
    id: string;
    regionId: string;
    name: string;
    code: string;
    slug: string;
}
interface Sector {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
}
interface Category {
    id: string;
    parentId?: string;
    sectorId?: string;
    name: string;
    slug: string;
    description?: string;
    level: number;
    children?: Category[];
}
interface Label {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
}
interface SocialLinks {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    pinterest?: string;
}
interface Brand {
    id: string;
    name: string;
    slug: string;
    tagline?: string;
    descriptionShort?: string;
    descriptionLong?: string;
    story?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    galleryUrls: string[];
    videoUrl?: string;
    region?: Region;
    regionId?: string;
    department?: Department;
    departmentId?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    sector?: Sector;
    sectorId?: string;
    categories?: Category[];
    labels?: Label[];
    madeInFranceLevel: MadeInFranceLevel;
    yearFounded?: number;
    employeeRange?: string;
    websiteUrl?: string;
    socialLinks: SocialLinks;
    status: BrandStatus;
    isVerified: boolean;
    isFeatured: boolean;
    isSponsored: boolean;
    subscriptionTier: SubscriptionTier;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}
interface BrandPreview {
    id: string;
    name: string;
    slug: string;
    tagline?: string;
    logoUrl?: string;
    region?: {
        name: string;
        slug: string;
    };
    sector?: {
        name: string;
        slug: string;
    };
    madeInFranceLevel: MadeInFranceLevel;
    isVerified: boolean;
    isFeatured: boolean;
    isSponsored: boolean;
}
interface Product {
    id: string;
    brandId: string;
    brand?: BrandPreview;
    name: string;
    slug: string;
    descriptionShort?: string;
    descriptionLong?: string;
    imageUrl?: string;
    galleryUrls: string[];
    category?: Category;
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    currency: string;
    manufacturingLocation?: string;
    materials: string[];
    madeInFranceLevel?: MadeInFranceLevel;
    externalBuyUrl?: string;
    affiliateUrl?: string;
    tags: string[];
    attributes: Record<string, string[]>;
    labels?: Label[];
    status: ProductStatus;
    isFeatured: boolean;
    isSponsored: boolean;
    aiSellingPoints: string[];
    createdAt: string;
    updatedAt: string;
}
interface ProductPreview {
    id: string;
    brandId: string;
    brand?: {
        name: string;
        slug: string;
    };
    name: string;
    slug: string;
    imageUrl?: string;
    priceMin?: number;
    priceMax?: number;
    currency: string;
    category?: {
        name: string;
        slug: string;
    };
    isFeatured: boolean;
}
interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: UserRole;
    preferences: Record<string, unknown>;
    favoriteCategories: string[];
    favoriteRegions: string[];
    createdAt: string;
    updatedAt: string;
}
interface UserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: UserRole;
}
interface SearchFilters {
    query?: string;
    sectors?: string[];
    categories?: string[];
    regions?: string[];
    labels?: string[];
    priceMin?: number;
    priceMax?: number;
    madeInFranceLevel?: MadeInFranceLevel[];
    tags?: string[];
    isVerified?: boolean;
    isFeatured?: boolean;
    sortBy?: 'relevance' | 'name' | 'newest' | 'price_asc' | 'price_desc';
}
interface FacetItem {
    value: string;
    label: string;
    count: number;
}
interface SearchFacets {
    sectors: FacetItem[];
    categories: FacetItem[];
    regions: FacetItem[];
    labels: FacetItem[];
    priceRanges: FacetItem[];
    madeInFranceLevels: FacetItem[];
}
interface SearchResponse<T> {
    results: T[];
    total: number;
    page: number;
    limit: number;
    facets?: SearchFacets;
    aiSummary?: string;
}
type AIIntent = 'gift' | 'self_purchase' | 'discovery' | 'comparison' | 'local_search' | 'question';
interface ParsedIntent {
    intent: AIIntent;
    priceRange?: {
        min?: number;
        max?: number;
    };
    categories: string[];
    sectors: string[];
    regions: string[];
    tags: string[];
    targetRecipient?: string;
    occasion?: string;
    constraints: string[];
    confidence: number;
}
interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    parsedIntent?: ParsedIntent;
    suggestions?: {
        brands: BrandPreview[];
        products: ProductPreview[];
    };
}
interface AIConversationResponse {
    response: string;
    conversationId: string;
    parsedIntent?: ParsedIntent;
    suggestions: {
        brands: BrandPreview[];
        products: ProductPreview[];
    };
}
interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}
interface MapBrandPoint {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    sector?: {
        name: string;
        slug: string;
        color?: string;
    };
    logoUrl?: string;
    isSponsored: boolean;
}
interface GeoJSONFeature {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
    properties: {
        id: string;
        name: string;
        slug: string;
        sector?: string;
        sectorColor?: string;
        logoUrl?: string;
        isSponsored: boolean;
    };
}
interface GeoJSONFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
}
interface BrandAnalytics {
    pageViews: number;
    uniqueVisitors: number;
    clickOuts: number;
    affiliateClicks: number;
    searchImpressions: number;
    favoritesAdded: number;
    trends: {
        date: string;
        pageViews: number;
        clickOuts: number;
    }[];
    topSearchQueries: {
        query: string;
        count: number;
    }[];
    visitorsByRegion: {
        region: string;
        count: number;
    }[];
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
interface TrackEventPayload {
    eventType: EventType;
    brandId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
}
interface SubscriptionPlan {
    id: string;
    tier: SubscriptionTier;
    name: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number;
    maxProducts?: number;
    maxTeamMembers?: number;
    hasAnalytics: boolean;
    hasAdvancedAnalytics: boolean;
    hasCampaigns: boolean;
    hasApiAccess: boolean;
    features: string[];
    isPopular: boolean;
}

export { type AIConversationResponse, type AIIntent, type AIMessage, type ApiResponse, type Brand, type BrandAnalytics, type BrandPreview, BrandStatus, type Category, type Department, EventType, type FacetItem, type GeoJSONFeature, type GeoJSONFeatureCollection, type Label, MadeInFranceLevel, type MapBounds, type MapBrandPoint, type PaginatedResponse, type ParsedIntent, type Product, type ProductPreview, ProductStatus, type Region, type SearchFacets, type SearchFilters, type SearchResponse, type Sector, type SocialLinks, type SubscriptionPlan, SubscriptionTier, type TrackEventPayload, type User, type UserProfile, UserRole };
