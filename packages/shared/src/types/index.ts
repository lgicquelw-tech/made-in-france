// ===========================================
// Made in France - Shared Types
// ===========================================

// ===========================================
// ENUMS (mirroring Prisma)
// ===========================================

export enum MadeInFranceLevel {
  FABRICATION_100_FRANCE = 'FABRICATION_100_FRANCE',
  ASSEMBLE_FRANCE = 'ASSEMBLE_FRANCE',
  CONCU_FRANCE = 'CONCU_FRANCE',
  MATIERE_FRANCE = 'MATIERE_FRANCE',
  ENTREPRISE_FRANCAISE = 'ENTREPRISE_FRANCAISE',
  MIXTE = 'MIXTE',
}

export enum BrandStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum UserRole {
  CONSUMER = 'CONSUMER',
  BRAND_OWNER = 'BRAND_OWNER',
  BRAND_MANAGER = 'BRAND_MANAGER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum EventType {
  BRAND_PAGE_VIEW = 'BRAND_PAGE_VIEW',
  PRODUCT_PAGE_VIEW = 'PRODUCT_PAGE_VIEW',
  SEARCH_RESULTS_VIEW = 'SEARCH_RESULTS_VIEW',
  SEARCH_QUERY = 'SEARCH_QUERY',
  FILTER_APPLIED = 'FILTER_APPLIED',
  MAP_INTERACTION = 'MAP_INTERACTION',
  CLICK_OUT = 'CLICK_OUT',
  AFFILIATE_CLICK = 'AFFILIATE_CLICK',
  ADD_TO_FAVORITES = 'ADD_TO_FAVORITES',
  AI_CONVERSATION = 'AI_CONVERSATION',
  AI_RECOMMENDATION_SHOWN = 'AI_RECOMMENDATION_SHOWN',
  AI_RECOMMENDATION_CLICKED = 'AI_RECOMMENDATION_CLICKED',
}

// ===========================================
// BASE TYPES
// ===========================================

export interface Region {
  id: string;
  name: string;
  slug: string;
  centerLat?: number;
  centerLng?: number;
}

export interface Department {
  id: string;
  regionId: string;
  name: string;
  code: string;
  slug: string;
}

export interface Sector {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

export interface Category {
  id: string;
  parentId?: string;
  sectorId?: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  children?: Category[];
}

export interface Label {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

// ===========================================
// BRAND TYPES
// ===========================================

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  pinterest?: string;
}

export interface Brand {
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

export interface BrandPreview {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  logoUrl?: string;
  region?: { name: string; slug: string };
  sector?: { name: string; slug: string };
  madeInFranceLevel: MadeInFranceLevel;
  isVerified: boolean;
  isFeatured: boolean;
  isSponsored: boolean;
}

// ===========================================
// PRODUCT TYPES
// ===========================================

export interface Product {
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

export interface ProductPreview {
  id: string;
  brandId: string;
  brand?: { name: string; slug: string };
  name: string;
  slug: string;
  imageUrl?: string;
  priceMin?: number;
  priceMax?: number;
  currency: string;
  category?: { name: string; slug: string };
  isFeatured: boolean;
}

// ===========================================
// USER TYPES
// ===========================================

export interface User {
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

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: UserRole;
}

// ===========================================
// SEARCH TYPES
// ===========================================

export interface SearchFilters {
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

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  sectors: FacetItem[];
  categories: FacetItem[];
  regions: FacetItem[];
  labels: FacetItem[];
  priceRanges: FacetItem[];
  madeInFranceLevels: FacetItem[];
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  facets?: SearchFacets;
  aiSummary?: string;
}

// ===========================================
// AI TYPES
// ===========================================

export type AIIntent =
  | 'gift'
  | 'self_purchase'
  | 'discovery'
  | 'comparison'
  | 'local_search'
  | 'question';

export interface ParsedIntent {
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

export interface AIMessage {
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

export interface AIConversationResponse {
  response: string;
  conversationId: string;
  parsedIntent?: ParsedIntent;
  suggestions: {
    brands: BrandPreview[];
    products: ProductPreview[];
  };
}

// ===========================================
// MAP TYPES
// ===========================================

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapBrandPoint {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  sector?: { name: string; slug: string; color?: string };
  logoUrl?: string;
  isSponsored: boolean;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
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

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// ===========================================
// ANALYTICS TYPES
// ===========================================

export interface BrandAnalytics {
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

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===========================================
// EVENT TRACKING TYPES
// ===========================================

export interface TrackEventPayload {
  eventType: EventType;
  brandId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
}

// ===========================================
// SUBSCRIPTION TYPES
// ===========================================

export interface SubscriptionPlan {
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
