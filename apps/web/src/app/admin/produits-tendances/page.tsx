'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Star, 
  StarOff,
  Package,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  isFeatured: boolean;
  status: string;
  brand: {
    id: string;
    name: string;
    slug: string;
    sector?: {
      color: string | null;
    };
  };
}

const API_URL = 'http://localhost:4000';

// Fonction de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminProduitsTendancesPage() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Debounce la recherche (300ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Charger les produits tendances actuels
  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  // Recherche automatique quand le texte change (après debounce)
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  async function fetchTrendingProducts() {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/trending`);
      const data = await res.json();
      setTrendingProducts(data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  // Rechercher des produits
  async function handleSearch(query: string) {
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/products/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearching(false);
    }
  }

  // Toggle produit tendance
  async function toggleFeatured(productId: string) {
    setTogglingId(productId);
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/toggle-featured`, {
        method: 'PUT',
      });
      const data = await res.json();
      
      // Mettre à jour les listes
      if (data.data.isFeatured) {
        // Ajouter aux tendances
        setTrendingProducts(prev => [data.data, ...prev.filter(p => p.id !== productId)]);
      } else {
        // Retirer des tendances
        setTrendingProducts(prev => prev.filter(p => p.id !== productId));
      }

      // Mettre à jour les résultats de recherche
      setSearchResults(prev => prev.map(p => 
        p.id === productId ? { ...p, isFeatured: data.data.isFeatured } : p
      ));
    } catch (error) {
      console.error('Erreur toggle:', error);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-france-red" />
                  Produits Tendances
                </h1>
                <p className="text-sm text-gray-500">
                  Gérez les produits affichés sur la page d'accueil
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {trendingProducts.length} produit{trendingProducts.length > 1 ? 's' : ''} en tendance
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Colonne gauche : Recherche */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                Ajouter un produit
              </h2>
              
              {/* Barre de recherche */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tapez pour rechercher... (min. 2 caractères)"
                  className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-france-blue focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-france-blue" />
                )}
                {searchQuery && !searching && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Indicateur de recherche */}
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-sm text-gray-400 mb-4">
                  Tapez au moins 2 caractères...
                </p>
              )}

              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-2">
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                  </p>
                  {searchResults.map((product) => (
                    <div 
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        product.isFeatured 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {/* Image */}
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {product.brand.name}
                          {product.priceMin && ` • ${product.priceMin.toFixed(2)} €`}
                        </p>
                      </div>

                      {/* Action */}
                      <Button
                        size="sm"
                        variant={product.isFeatured ? "destructive" : "default"}
                        onClick={() => toggleFeatured(product.id)}
                        disabled={togglingId === product.id}
                        className="flex-shrink-0"
                      >
                        {togglingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : product.isFeatured ? (
                          <>
                            <StarOff className="h-4 w-4 mr-1" />
                            Retirer
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Ajouter
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {debouncedSearchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucun produit trouvé pour "{debouncedSearchQuery}"</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Essayez avec d'autres mots-clés
                  </p>
                </div>
              )}

              {!searchQuery && searchResults.length === 0 && (
                <p className="text-gray-400 text-center py-8 text-sm">
                  Commencez à taper pour rechercher un produit par nom ou marque
                </p>
              )}
            </div>
          </div>

          {/* Colonne droite : Produits tendances actuels */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-france-red" />
                Produits en tendance ({trendingProducts.length})
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : trendingProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Aucun produit en tendance</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Recherchez et ajoutez des produits depuis la colonne de gauche
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {trendingProducts.map((product, index) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-france-red/5 to-transparent border border-france-red/10"
                    >
                      {/* Position */}
                      <div className="w-6 h-6 rounded-full bg-france-red text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Image */}
                      <div className="w-12 h-12 rounded-lg bg-white border flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {product.brand.name}
                          {product.priceMin && ` • ${product.priceMin.toFixed(2)} €`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link 
                          href={`/marques/${product.brand.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleFeatured(product.id)}
                          disabled={togglingId === product.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {togglingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {trendingProducts.length > 0 && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Les 8 premiers produits seront affichés sur la page d'accueil
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
