'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Grid3X3,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  ArrowRight
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
    <div className="min-h-screen bg-france-cream">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-france-blue to-france-blue/90 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-france-red rounded-full blur-3xl translate-y-1/2" />
        </div>

        <div className="relative container py-16 md:py-20">
          <div className="flex items-center gap-3 text-white/70 mb-4">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Catalogue</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Produits Made in France
          </h1>
          <p className="text-xl text-white/70 max-w-2xl">
            {totalProducts.toLocaleString()} produits de {sectors.length} secteurs
          </p>

          {/* Flag bar */}
          <div className="flex h-1 w-24 rounded-full overflow-hidden mt-8">
            <span className="bg-france-blue flex-1 opacity-50" />
            <span className="bg-white flex-1" />
            <span className="bg-france-red flex-1" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-soft">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-france-blue hover:text-france-blue'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm">Filtres</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:border-france-blue hover:text-france-blue transition-all"
                >
                  <span className="text-sm font-medium">
                    {sortLabels[sortBy]}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-soft-lg border border-gray-100 py-2 z-20">
                      {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortBy(option); setShowSortMenu(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-france-blue/5 transition-colors ${
                            sortBy === option ? 'text-france-blue font-semibold bg-france-blue/5' : 'text-gray-700'
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
              <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-3 transition-colors ${gridCols === 3 ? 'bg-france-blue/10 text-france-blue' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-3 transition-colors ${gridCols === 4 ? 'bg-france-blue/10 text-france-blue' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in-up">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Sector filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-semibold text-france-blue mb-2">Secteur</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => { setSelectedSector(e.target.value); setPage(1); }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue bg-white transition-all"
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
                <div className="flex gap-3 items-center">
                  <div>
                    <label className="block text-sm font-semibold text-france-blue mb-2">Prix min</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={priceMin}
                      onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                      className="w-28 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all"
                    />
                  </div>
                  <span className="text-gray-400 mt-6">—</span>
                  <div>
                    <label className="block text-sm font-semibold text-france-blue mb-2">Prix max</label>
                    <input
                      type="number"
                      placeholder="∞"
                      value={priceMax}
                      onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                      className="w-28 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all"
                    />
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-france-red hover:bg-france-red/5 rounded-xl transition-colors font-medium"
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
      <div className="container py-8">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-500 font-medium">Chargement des produits...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-france-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-france-blue" />
            </div>
            <h3 className="text-xl font-bold text-france-blue mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500 mb-6">Essayez de modifier vos filtres</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="btn-primary rounded-full">
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid gap-5 ${
              gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/produits/${product.slug}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/50 shadow-soft hover:shadow-soft-lg transition-all duration-300"
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
                        style={{ backgroundColor: product.brand.sector?.color || '#0D2B4E' }}
                      >
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">{product.brand.name}</p>
                    <h3 className="font-semibold text-france-blue line-clamp-2 group-hover:text-france-red transition-colors mb-2">
                      {product.name}
                    </h3>
                    {product.priceMin && (
                      <p className="text-lg font-bold" style={{ color: product.brand.sector?.color || '#0D2B4E' }}>
                        {formatPrice(product.priceMin, product.priceMax)}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm font-medium text-france-blue group-hover:text-france-red transition-colors">
                      Voir le produit
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <p className="text-sm text-gray-500 mb-4 font-medium">
                  {products.length} sur {totalProducts.toLocaleString()} produits
                </p>
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-gradient-to-r from-france-blue to-france-blue/90 text-white rounded-xl font-semibold hover:shadow-glow-blue transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
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
