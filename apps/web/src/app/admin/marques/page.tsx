'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Building2,
  Crown,
  Star,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Download,
  Filter,
  Sparkles
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl?: string | null;
  city: string | null;
  region: { id: string; name: string; slug: string } | null;
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
      case 'ROYALE': return 'bg-gradient-to-r from-france-gold to-amber-500 text-white';
      case 'PREMIUM': return 'bg-gradient-to-r from-france-blue to-blue-600 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'VERIFIED': return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Vérifiée' };
      case 'PENDING': return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'En attente' };
      case 'REJECTED': return { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejetée' };
      default: return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, label: 'Brouillon' };
    }
  };

  // Recherche locale en plus de l'API
  const filteredBrands = search
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-france-blue">Marques</h1>
          <p className="text-gray-500 mt-1">{totalBrands.toLocaleString()} marques référencées</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-gray-50 transition-all shadow-soft text-gray-600 font-medium">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <Link href="/admin/marques/new" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-france-blue to-france-blue/90 text-white rounded-xl hover:shadow-glow-blue transition-all font-medium">
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-france-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">{totalBrands}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">{totalBrands}</div>
              <div className="text-sm text-gray-500">Vérifiées</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">0</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">57</div>
              <div className="text-sm text-gray-500">Abonnées</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une marque..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 font-medium">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Marque</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produits</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                        {brand.logoUrl || brand.websiteUrl ? (
                          <img
                            src={brand.logoUrl?.includes('clearbit') || !brand.logoUrl
                              ? `https://www.google.com/s2/favicons?domain=${new URL(brand.websiteUrl || 'https://example.com').hostname}&sz=128`
                              : brand.logoUrl
                            }
                            alt={brand.name}
                            className="w-12 h-12 rounded-xl object-contain"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-france-blue group-hover:text-france-red transition-colors">{brand.name}</div>
                        <div className="text-sm text-gray-400">/{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(brand.city || brand.region?.name || brand.regionName) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span>{brand.city}{brand.city && (brand.region?.name || brand.regionName) ? ', ' : ''}{brand.regionName || brand.region?.name || ''}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-france-blue">{brand._count?.products || brand.productsCount || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/marques/${brand.slug}`}
                        target="_blank"
                        className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors group/btn"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4 text-gray-400 group-hover/btn:text-france-blue" />
                      </Link>
                      <Link
                        href={`/admin/marques/${brand.id}`}
                        className="p-2.5 hover:bg-france-blue/10 rounded-xl transition-colors group/btn"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 text-gray-400 group-hover/btn:text-france-blue" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-france-blue">{page}</span> sur <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            {/* Page numbers */}
            <div className="hidden md:flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-medium transition-all ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
