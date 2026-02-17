'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Building2, ShoppingBag, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBrand {
  type: 'brand';
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  sector: string | null;
  sectorSlug: string | null;
  sectorColor: string | null;
}

interface SearchProduct {
  type: 'product';
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brandName: string;
  brandSlug: string;
  sectorColor: string | null;
}

type FilterType = 'all' | 'brands' | 'products';

export default function RecherchePage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<{ brands: SearchBrand[]; products: SearchProduct[] }>({ brands: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    async function search() {
      if (!searchQuery.trim()) {
        setResults({ brands: [], products: [] });
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/v1/search/all?q=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await res.json();
        setResults({ brands: data.brands || [], products: data.products || [] });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min) return null;
    if (min === max || !max) return `${min.toFixed(2)} €`;
    return `${min.toFixed(2)} - ${max.toFixed(2)} €`;
  };

  const filteredBrands = filter === 'products' ? [] : results.brands;
  const filteredProducts = filter === 'brands' ? [] : results.products;
  const totalResults = filteredBrands.length + filteredProducts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Recherche</h1>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une marque ou un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20 outline-none"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Filters */}
          {searchQuery && (
            <div className="flex items-center gap-2 mt-4">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-france-blue text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tout ({results.brands.length + results.products.length})
                </button>
                <button
                  onClick={() => setFilter('brands')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filter === 'brands' 
                      ? 'bg-france-blue text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Marques ({results.brands.length})
                </button>
                <button
                  onClick={() => setFilter('products')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filter === 'products' 
                      ? 'bg-france-blue text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Produits ({results.products.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {!searchQuery ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Tapez votre recherche pour trouver des marques et produits Made in France
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 text-france-blue mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Recherche en cours...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">
              Aucun résultat pour "{searchQuery}"
            </p>
            <p className="text-gray-400">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Produits */}
            {filteredProducts.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  Produits ({filteredProducts.length})
                </h2>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/produits/${product.slug}`}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
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
                            className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                            style={{ backgroundColor: product.sectorColor || '#002395' }}
                          >
                            {product.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-1">{product.brandName}</p>
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm group-hover:text-france-blue transition-colors">
                          {product.name}
                        </h3>
                        {product.priceMin && (
                          <p className="font-semibold mt-2" style={{ color: product.sectorColor || '#002395' }}>
                            {formatPrice(product.priceMin, product.priceMax)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Marques */}
            {filteredBrands.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  Marques ({filteredBrands.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/marques/${brand.slug}`}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                    >
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                        style={{ backgroundColor: brand.sectorColor || '#002395' }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                        <p className="text-sm text-gray-500">
                          {brand.city}{brand.sector && ` • ${brand.sector}`}
                        </p>
                        {brand.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {brand.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
