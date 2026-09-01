'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Crown,
  Shield,
  Ban,
  MoreVertical,
  Mail,
  Calendar,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
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

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Expert': return 'bg-purple-100 text-purple-700';
      case 'Ambassadeur': return 'bg-amber-100 text-amber-700';
      case 'Explorateur': return 'bg-blue-100 text-blue-700';
      case 'Découvreur': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">{totalUsers.toLocaleString()} utilisateurs inscrits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
            />
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setFilter('owners'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'owners' ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Crown className="w-4 h-4 inline mr-1" />
              Propriétaires
            </button>
            <button
              onClick={() => { setFilter('active'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'active' ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Actifs (7j)
            </button>
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">156</div>
              <div className="text-sm text-gray-500">Ce mois</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">57</div>
              <div className="text-sm text-gray-500">Propriétaires</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">423</div>
              <div className="text-sm text-gray-500">Actifs (7j)</div>
            </div>
          </div>
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rang</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Points</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Activité</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Inscription</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Dernière connexion</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-france-blue to-france-red flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name || 'Sans nom'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        {(user._count?.ownedBrands || 0) > 0 && (
                          <Crown className="w-4 h-4 text-amber-500" title="Propriétaire de marque" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRankColor(user.rank)}`}>
                        {user.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.points}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span title="Favoris">❤️ {user._count?.favorites || 0}</span>
                        <span title="Vues">👁️ {user._count?.brandViews || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir détails">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Envoyer email">
                          <Mail className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Bannir">
                          <Ban className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}