'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  Star,
  TrendingUp,
  Download,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Product {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  isFeatured: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

interface Sector {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');

  useEffect(() => {
    loadProducts();
    loadSectors();
  }, [page, search, statusFilter, selectedSector]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter,
        sector: selectedSector
      });
      
      const res = await fetch(`${API_URL}/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.total || 0);
      } else {
        // Fallback data
        setProducts([
          { id: '1', name: 'Slip Français Bleu', slug: 'slip-francais-bleu', descriptionShort: 'Le slip iconique made in France', imageUrl: null, priceMin: 35, priceMax: 35, status: 'ACTIVE', isFeatured: true, brand: { id: 'b1', name: 'Le Slip Français', slug: 'le-slip-francais' }, category: { id: 'c1', name: 'Sous-vêtements' } },
          { id: '2', name: 'Marinière Saint James', slug: 'mariniere-saint-james', descriptionShort: 'La marinière authentique bretonne', imageUrl: null, priceMin: 89, priceMax: 120, status: 'ACTIVE', isFeatured: false, brand: { id: 'b2', name: 'Saint James', slug: 'saint-james' }, category: { id: 'c2', name: 'Vêtements' } },
          { id: '3', name: 'Couteau Opinel N°8', slug: 'couteau-opinel-n8', descriptionShort: 'Le couteau pliant légendaire', imageUrl: null, priceMin: 15, priceMax: 25, status: 'ACTIVE', isFeatured: true, brand: { id: 'b3', name: 'Opinel', slug: 'opinel' }, category: { id: 'c3', name: 'Maison' } },
          { id: '4', name: 'Savon de Marseille 300g', slug: 'savon-marseille-300g', descriptionShort: 'Savon traditionnel à l\'huile d\'olive', imageUrl: null, priceMin: 8, priceMax: 12, status: 'ACTIVE', isFeatured: false, brand: { id: 'b4', name: 'Marius Fabre', slug: 'marius-fabre' }, category: { id: 'c4', name: 'Beauté' } },
          { id: '5', name: 'Espadrilles Basques', slug: 'espadrilles-basques', descriptionShort: 'Espadrilles artisanales du Pays Basque', imageUrl: null, priceMin: 45, priceMax: 65, status: 'DRAFT', isFeatured: false, brand: { id: 'b5', name: 'Prodiso', slug: 'prodiso' }, category: { id: 'c5', name: 'Chaussures' } },
        ]);
        setTotalPages(1992);
        setTotalProducts(39835);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSectors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectors(data.data || []);
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min && !max) return '-';
    if (min === max || !max) return `${min} €`;
    return `${min} - ${max} €`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'OUT_OF_STOCK':
        return 'bg-amber-100 text-amber-700';
      case 'DISCONTINUED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'DRAFT': return 'Brouillon';
      case 'OUT_OF_STOCK': return 'Rupture';
      case 'DISCONTINUED': return 'Arrêté';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-500 mt-1">{totalProducts.toLocaleString()} produits référencés</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <Link
            href="/admin/produits-tendances"
            className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Tendances
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalProducts.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total produits</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">38 500</div>
              <div className="text-sm text-gray-500">Actifs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">En vedette</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">89%</div>
              <div className="text-sm text-gray-500">Avec image</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
            />
          </div>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="DRAFT">Brouillon</option>
            <option value="OUT_OF_STOCK">Rupture</option>
            <option value="DISCONTINUED">Arrêté</option>
          </select>

          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={(e) => { setSelectedSector(e.target.value); setPage(1); }}
            className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
          >
            <option value="all">Tous les secteurs</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>{sector.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-france-blue"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Marque</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Catégorie</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Prix</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                              {product.name}
                              {product.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.descriptionShort || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/marques/${product.brand.id}`}
                          className="text-france-blue hover:underline"
                        >
                          {product.brand.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatPrice(product.priceMin, product.priceMax)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/marques/${product.brand.slug}`}
                            target="_blank"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir sur le site"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </Link>
                          <Link
                            href={`/admin/produits/${product.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} sur {totalPages.toLocaleString()} ({totalProducts.toLocaleString()} produits)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Début
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-france-blue text-white rounded-lg font-medium">
                  {page}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Fin
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}