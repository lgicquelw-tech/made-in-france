'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search,
  SlidersHorizontal,
  ChevronDown,
  Grid3X3,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  buyUrl: string | null;
  category: string | null;
  isFeatured: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  sector: {
    color: string | null;
  } | null;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'featured';

const ITEMS_PER_PAGE = 24;

export default function BrandProductsPage() {
  const params = useParams();
  const brandSlug = params.slug as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et tri
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Pagination
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Layout
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  useEffect(() => {
    async function fetchData() {
      try {
        // Charger la marque
        const brandRes = await fetch(`http://localhost:4000/api/v1/brands/${brandSlug}`);
        if (!brandRes.ok) {
          setError('Marque non trouvée');
          return;
        }
        const brandData = await brandRes.json();
        setBrand(brandData.data);

        // Charger tous les produits
        const productsRes = await fetch(`http://localhost:4000/api/v1/brands/${brandSlug}/products`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data || []);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    if (brandSlug) {
      fetchData();
    }
  }, [brandSlug]);

  // Filtrer et trier les produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Tri
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.priceMin || 0) - (a.priceMin || 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return 0;
        });
        break;
    }

    return result;
  }, [products, searchQuery, sortBy]);

  const visibleProducts = filteredAndSortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedProducts.length;

  const loadMore = () => {
    setLoadingMore(true);
    // Simuler un petit délai pour l'UX
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 300);
  };

  const sectorColor = brand?.sector?.color || '#002395';

  const sortLabels: Record<SortOption, string> = {
    'featured': 'Mis en avant',
    'name-asc': 'Nom A-Z',
    'name-desc': 'Nom Z-A',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/marques" className="inline-flex items-center text-france-blue hover:underline mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux marques
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Marque non trouvée'}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="bg-gradient-to-r py-8"
        style={{ backgroundColor: sectorColor }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Link 
            href={`/marques/${brandSlug}`} 
            className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à {brand.name}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Produits {brand.name}
          </h1>
          <p className="text-white/80 mt-2">
            {products.length} produits disponibles
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on search
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Tri */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white"
                >
                  <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {sortLabels[sortBy]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showSortMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowSortMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setShowSortMenu(false);
                          }}
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

          {/* Résultats count */}
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-3">
              {filteredAndSortedProducts.length} résultat{filteredAndSortedProducts.length > 1 ? 's' : ''} 
              {searchQuery && ` pour "${searchQuery}"`}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              Aucun produit trouvé
              {searchQuery && ` pour "${searchQuery}"`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-france-blue hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`grid gap-4 md:gap-6 ${
              gridCols === 3 
                ? 'grid-cols-2 md:grid-cols-3' 
                : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {visibleProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/produits/${product.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
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
                        style={{ backgroundColor: sectorColor }}
                      >
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-france-blue transition-colors">
                      {product.name}
                    </h3>
                    {product.priceMin && (
                      <p className="text-lg font-bold mt-2" style={{ color: sectorColor }}>
                        {product.priceMin === product.priceMax || !product.priceMax
                          ? `${product.priceMin.toFixed(2)} €`
                          : `${product.priceMin.toFixed(2)} - ${product.priceMax.toFixed(2)} €`
                        }
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
                  {visibleCount} sur {filteredAndSortedProducts.length} produits affichés
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
                    `Charger plus (${Math.min(ITEMS_PER_PAGE, filteredAndSortedProducts.length - visibleCount)} produits)`
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
