'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, Crown, Star, Eye, Edit, Trash2, ChevronLeft, ChevronRight, MapPin, CheckCircle, Clock, XCircle, Plus, Download } from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  region: string | null;
  regionName?: string;
  tier: 'FREE' | 'PREMIUM' | 'ROYALE';
  status: 'DRAFT' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  _count?: {
    products: number;
  };
  productsCount?: number;
  createdAt: string;
}

export default function MarquesPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBrands, setTotalBrands] = useState(0);

  useEffect(() => {
    loadBrands();
  }, [page, search]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (search) {
        params.append('search', search);
      }

      const res = await fetch(`${API_URL}/api/admin/brands?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalBrands(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string | undefined) => {
    switch (tier) {
      case 'ROYALE': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      case 'PREMIUM': return 'bg-gradient-to-r from-france-blue to-blue-600 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'VERIFIED': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Vérifiée' };
      case 'PENDING': return { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'En attente' };
      case 'REJECTED': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejetée' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Brouillon' };
    }
  };

  // Recherche locale en plus de l'API
  const filteredBrands = search 
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marques</h1>
          <p className="text-gray-500 mt-1">{totalBrands.toLocaleString()} marques référencées</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <Link href="/admin/marques/new" className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors">
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalBrands}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalBrands}</div>
              <div className="text-sm text-gray-500">Vérifiées</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Star className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">57</div>
              <div className="text-sm text-gray-500">Abonnées</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher une marque..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-france-blue"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Marque</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Localisation</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produits</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {brand.logoUrl || brand.websiteUrl ? (
  <img 
    src={brand.logoUrl?.includes('clearbit') || !brand.logoUrl 
      ? `https://www.google.com/s2/favicons?domain=${new URL(brand.websiteUrl || 'https://example.com').hostname}&sz=128`
      : brand.logoUrl
    } 
    alt={brand.name} 
    className="w-10 h-10 rounded-lg object-contain" 
  />
                        ) : (
                          <Building2 className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{brand.name}</div>
                        <div className="text-sm text-gray-500">/{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(brand.city || brand.region || brand.regionName) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {brand.city}{brand.city && (brand.region || brand.regionName) ? ', ' : ''}{brand.region?.name || ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {brand._count?.products || brand.productsCount || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/marques/${brand.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Link>
                      <Link href={`/admin/marques/${brand.id}`} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                        <Edit className="w-4 h-4 text-france-blue" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} sur {totalPages}</div>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
