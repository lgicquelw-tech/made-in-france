import type {
  Brand,
  BrandPreview,
  Product,
  ProductPreview,
  SearchFilters,
  SearchResponse,
  AIConversationResponse,
  GeoJSONFeatureCollection,
  Sector,
  Category,
  Region,
  Label,
  BrandAnalytics,
  PaginatedResponse,
} from '@mif/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Une erreur est survenue'
    );
  }

  return response.json();
}

// ===========================================
// SEARCH API
// ===========================================

export const searchApi = {
  search: async (
    filters: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<SearchResponse<BrandPreview | ProductPreview>> => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.sectors?.length) params.set('sectors', filters.sectors.join(','));
    if (filters.categories?.length) params.set('categories', filters.categories.join(','));
    if (filters.regions?.length) params.set('regions', filters.regions.join(','));
    if (filters.priceMin) params.set('price_min', String(filters.priceMin));
    if (filters.priceMax) params.set('price_max', String(filters.priceMax));
    if (filters.sortBy) params.set('sort', filters.sortBy);
    params.set('page', String(page));
    params.set('limit', String(limit));

    return fetcher(`/api/v1/search?${params.toString()}`);
  },

  aiSearch: async (
    message: string,
    conversationId?: string
  ): Promise<AIConversationResponse> => {
    return fetcher('/api/v1/search/ai', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  },

  suggest: async (query: string): Promise<{
    suggestions: string[];
    brands: BrandPreview[];
    categories: Category[];
  }> => {
    return fetcher(`/api/v1/search/suggest?q=${encodeURIComponent(query)}`);
  },
};

// ===========================================
// BRANDS API
// ===========================================

export const brandsApi = {
  list: async (params: {
    sector?: string;
    region?: string;
    category?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<BrandPreview>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, String(value));
    });
    return fetcher(`/api/v1/brands?${searchParams.toString()}`);
  },

  get: async (slug: string): Promise<Brand> => {
    return fetcher(`/api/v1/brands/${slug}`);
  },

  getProducts: async (
    slug: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<ProductPreview>> => {
    return fetcher(`/api/v1/brands/${slug}/products?page=${page}&limit=${limit}`);
  },

  getFeatured: async (): Promise<BrandPreview[]> => {
    return fetcher('/api/v1/brands/featured');
  },

  getNearby: async (
    lat: number,
    lng: number,
    radius = 50,
    limit = 10
  ): Promise<{ data: BrandPreview[]; distances: Record<string, number> }> => {
    return fetcher(
      `/api/v1/brands/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`
    );
  },
};

// ===========================================
// PRODUCTS API
// ===========================================

export const productsApi = {
  list: async (params: {
    brand?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<ProductPreview>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });
    return fetcher(`/api/v1/products?${searchParams.toString()}`);
  },

  get: async (id: string): Promise<Product> => {
    return fetcher(`/api/v1/products/${id}`);
  },

  getFeatured: async (): Promise<ProductPreview[]> => {
    return fetcher('/api/v1/products/featured');
  },
};

// ===========================================
// MAP API
// ===========================================

export const mapApi = {
  getBrands: async (params: {
    bounds?: string;
    sector?: string;
    category?: string;
  } = {}): Promise<GeoJSONFeatureCollection> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    return fetcher(`/api/v1/map/brands?${searchParams.toString()}`);
  },

  getClusters: async (
    bounds: string,
    zoom: number
  ): Promise<{ clusters: unknown[]; points: GeoJSONFeatureCollection }> => {
    return fetcher(`/api/v1/map/clusters?bounds=${bounds}&zoom=${zoom}`);
  },
};

// ===========================================
// REFERENCE DATA API
// ===========================================

export const referenceApi = {
  getSectors: async (): Promise<Sector[]> => {
    return fetcher('/api/v1/sectors');
  },

  getCategories: async (params: {
    sector?: string;
    flat?: boolean;
  } = {}): Promise<Category[]> => {
    const searchParams = new URLSearchParams();
    if (params.sector) searchParams.set('sector', params.sector);
    if (params.flat) searchParams.set('flat', 'true');
    return fetcher(`/api/v1/categories?${searchParams.toString()}`);
  },

  getRegions: async (): Promise<Region[]> => {
    return fetcher('/api/v1/regions');
  },

  getLabels: async (): Promise<Label[]> => {
    return fetcher('/api/v1/labels');
  },
};

// ===========================================
// EVENTS API
// ===========================================

export const eventsApi = {
  track: async (payload: {
    eventType: string;
    brandId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> => {
    await fetcher('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// ===========================================
// USER API
// ===========================================

export const userApi = {
  getMe: async (): Promise<unknown> => {
    return fetcher('/api/v1/me');
  },

  getFavorites: async (): Promise<{
    brands: BrandPreview[];
    products: ProductPreview[];
  }> => {
    return fetcher('/api/v1/me/favorites');
  },

  addFavorite: async (params: {
    brandId?: string;
    productId?: string;
  }): Promise<void> => {
    await fetcher('/api/v1/me/favorites', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  removeFavorite: async (id: string): Promise<void> => {
    await fetcher(`/api/v1/me/favorites/${id}`, {
      method: 'DELETE',
    });
  },

  getRecommendations: async (): Promise<{
    brands: BrandPreview[];
    products: ProductPreview[];
  }> => {
    return fetcher('/api/v1/me/recommendations');
  },
};

// ===========================================
// BRAND DASHBOARD API
// ===========================================

export const brandDashboardApi = {
  getProfile: async (): Promise<Brand> => {
    return fetcher('/api/v1/brand/profile');
  },

  updateProfile: async (data: Partial<Brand>): Promise<Brand> => {
    return fetcher('/api/v1/brand/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getAnalytics: async (period: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<BrandAnalytics> => {
    return fetcher(`/api/v1/brand/analytics/overview?period=${period}`);
  },

  generateDescription: async (params: {
    type: 'brand' | 'product';
    context: Record<string, unknown>;
  }): Promise<{ descriptionShort: string; descriptionLong: string }> => {
    return fetcher('/api/v1/brand/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// Export default API object
export const api = {
  search: searchApi,
  brands: brandsApi,
  products: productsApi,
  map: mapApi,
  reference: referenceApi,
  events: eventsApi,
  user: userApi,
  brandDashboard: brandDashboardApi,
};

export { ApiError };
