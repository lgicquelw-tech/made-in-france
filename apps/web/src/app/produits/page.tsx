'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  X,
  Loader2,
  Grid3X3,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brand: {
    name: string;
    slug: string;
    sector?: {
      color: string | null;
    };
  };
}

interface Sector {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { brands: number };
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

const ITEMS_PER_PAGE = 24;

export default function ProduitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSector, setSelectedSector] = useState(searchParams.get('secteur') || '');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('tri') as SortOption) || 'newest');
  const [priceMin, setPriceMin] = useState(searchParams.get('prixMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('prixMax') || '');
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  // Fetch sectors
  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/sectors/with-counts');
        const data = await res.json();
        setSectors(data.data || []);
      } catch (error) {
        console.error('Error fetching sectors:', error);
      }
    }
    fetchSectors();
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(ITEMS_PER_PAGE * page));
        if (searchQuery) params.set('q', searchQuery);
        if (selectedSector) params.set('sector', selectedSector);
        if (sortBy) params.set('sort', sortBy);
        if (priceMin) params.set('priceMin', priceMin);
        if (priceMax) params.set('priceMax', priceMax);

        const res = await fetch(`http://localhost:4000/api/v1/products?${params}`);
        const data = await res.json();
        setProducts(data.data || []);
        setTotalProducts(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedSector, sortBy, priceMin, priceMax, page]);

  const loadMore = () => {
    setLoadingMore(true);
    setPage(prev => prev + 1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSector('');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedSector || priceMin || priceMax;
  const hasMore = products.length < totalProducts;

  const sortLabels: Record<SortOption, string> = {
    'newest': 'Plus récents',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
    'name-asc': 'Nom A-Z',
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min) return null;
    if (min === max || !max) return `${min.toFixed(0)} €`;
    return `${min.toFixed(0)} - ${max.toFixed(0)} €`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits Made in France</h1>
          <p className="text-gray-500">
            {totalProducts.toLocaleString()} produits de {sectors.length} secteurs
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
                  showFilters || hasActiveFilters 
                    ? 'border-france-blue bg-france-blue/5 text-france-blue' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm font-medium">Filtres</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-france-blue" />
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {sortLabels[sortBy]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortBy(option); setShowSortMenu(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            sortBy === option ? 'text-france-blue font-medium' : 'text-gray-700'
                          }`}
                        >
                          {sortLabels[option]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Grid toggle */}
              <div className="hidden md:flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2.5 ${gridCols === 3 ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-2.5 ${gridCols === 4 ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Sector filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => { setSelectedSector(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-france-blue/20"
                  >
                    <option value="">Tous les secteurs</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.slug}>
                        {sector.name} ({sector._count.brands})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div className="flex gap-2 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix min</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={priceMin}
                      onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-france-blue/20"
                    />
                  </div>
                  <span className="text-gray-400 mt-6">—</span>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix max</label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={priceMax}
                      onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-france-blue/20"
                    />
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Effacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && products.length === 0 ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 text-france-blue mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">Aucun produit trouvé</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-france-blue hover:underline">
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid gap-4 md:gap-6 ${
              gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/produits/${product.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                        style={{ backgroundColor: product.brand.sector?.color || '#002395' }}
                      >
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-france-blue transition-colors">
                      {product.name}
                    </h3>
                    {product.priceMin && (
                      <p className="text-lg font-bold mt-2" style={{ color: product.brand.sector?.color || '#002395' }}>
                        {formatPrice(product.priceMin, product.priceMax)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <p className="text-sm text-gray-500 mb-4">
                  {products.length} sur {totalProducts.toLocaleString()} produits
                </p>
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Charger plus'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
