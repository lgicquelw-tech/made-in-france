'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Crown,
  Shield,
  Ban,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  points: number;
  rank: string;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    favorites: number;
    brandViews: number;
    ownedBrands: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filter, setFilter] = useState<'all' | 'owners' | 'active'>('all');

  useEffect(() => {
    loadUsers();
  }, [page, search, filter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/users?page=${page}&limit=20&search=${search}&filter=${filter}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
      } else {
        // Fallback data
        setUsers([
          { id: '1', name: 'Jean Dupont', email: 'jean@example.com', image: null, points: 150, rank: 'Explorateur', createdAt: '2024-01-15', lastLoginAt: '2024-01-20', _count: { favorites: 12, brandViews: 45, ownedBrands: 0 } },
          { id: '2', name: 'Marie Martin', email: 'marie@example.com', image: null, points: 520, rank: 'Ambassadeur', createdAt: '2023-11-10', lastLoginAt: '2024-01-19', _count: { favorites: 34, brandViews: 120, ownedBrands: 1 } },
          { id: '3', name: 'Pierre Durand', email: 'pierre@example.com', image: null, points: 80, rank: 'Découvreur', createdAt: '2024-01-05', lastLoginAt: '2024-01-18', _count: { favorites: 5, brandViews: 20, ownedBrands: 0 } },
          { id: '4', name: 'Sophie Bernard', email: 'sophie@leslipfrancais.fr', image: null, points: 1200, rank: 'Expert', createdAt: '2023-06-20', lastLoginAt: '2024-01-20', _count: { favorites: 8, brandViews: 200, ownedBrands: 2 } },
          { id: '5', name: 'Lucas Petit', email: 'lucas@example.com', image: null, points: 45, rank: 'Novice', createdAt: '2024-01-18', lastLoginAt: null, _count: { favorites: 2, brandViews: 8, ownedBrands: 0 } },
        ]);
        setTotalPages(5);
        setTotalUsers(89);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: string) => {
    switch (rank) {
      case 'Expert': return { bg: 'bg-gradient-to-r from-purple-500/10 to-purple-500/20', text: 'text-purple-700', border: 'border-purple-200' };
      case 'Ambassadeur': return { bg: 'bg-gradient-to-r from-amber-500/10 to-amber-500/20', text: 'text-amber-700', border: 'border-amber-200' };
      case 'Explorateur': return { bg: 'bg-gradient-to-r from-blue-500/10 to-blue-500/20', text: 'text-blue-700', border: 'border-blue-200' };
      case 'Découvreur': return { bg: 'bg-gradient-to-r from-green-500/10 to-green-500/20', text: 'text-green-700', border: 'border-green-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-france-blue">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">{totalUsers.toLocaleString()} utilisateurs inscrits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-gray-50 transition-all shadow-soft text-gray-600 font-medium">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-soft">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all outline-none"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setFilter('owners'); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'owners'
                  ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              Propriétaires
            </button>
            <button
              onClick={() => { setFilter('active'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'active'
                  ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              Actifs (7j)
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-france-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">{totalUsers}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">156</div>
              <div className="text-sm text-gray-500">Ce mois</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">57</div>
              <div className="text-sm text-gray-500">Propriétaires</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-france-blue">423</div>
              <div className="text-sm text-gray-500">Actifs (7j)</div>
            </div>
          </div>
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
          <>
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rang</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activité</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const rankStyle = getRankStyle(user.rank);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-france-blue to-france-red flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform">
                            {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-france-blue group-hover:text-france-red transition-colors">
                                {user.name || 'Sans nom'}
                              </span>
                              {(user._count?.ownedBrands || 0) > 0 && (
                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center" title="Propriétaire de marque">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
                          {user.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-france-blue">{user.points}</span>
                          <span className="text-xs text-gray-400">pts</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-500" title="Favoris">
                            <span className="text-red-400">❤️</span> {user._count?.favorites || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500" title="Vues">
                            <span className="text-blue-400">👁️</span> {user._count?.brandViews || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors group/btn" title="Voir détails">
                            <Eye className="w-4 h-4 text-gray-400 group-hover/btn:text-france-blue" />
                          </button>
                          <button className="p-2.5 hover:bg-blue-50 rounded-xl transition-colors group/btn" title="Envoyer email">
                            <Mail className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-600" />
                          </button>
                          <button className="p-2.5 hover:bg-red-50 rounded-xl transition-colors group/btn" title="Bannir">
                            <Ban className="w-4 h-4 text-gray-400 group-hover/btn:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

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
          </>
        )}
      </div>
    </div>
  );
}
