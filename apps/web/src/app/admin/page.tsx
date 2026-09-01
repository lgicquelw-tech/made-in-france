'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Heart,
  Bot,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Activity,
  DollarSign,
  Search
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Stats {
  brands: { total: number; active: number; pending: number; thisMonth: number };
  products: { total: number; active: number; featured: number };
  users: { total: number; thisMonth: number; active: number };
  subscriptions: { free: number; premium: number; royale: number; mrr: number };
  analytics: { pageViews: number; clickOuts: number; favorites: number; searches: number };
  ai: { conversations: number; tokensUsed: number; cost: number };
}

interface RecentActivity {
  id: string;
  type: 'brand_created' | 'user_signup' | 'subscription' | 'favorite';
  message: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard/stats?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      } else {
        // Fallback data
        setStats({
          brands: { total: 902, active: 856, pending: 12, thisMonth: 24 },
          products: { total: 39835, active: 38500, featured: 12 },
          users: { total: 1847, thisMonth: 156, active: 423 },
          subscriptions: { free: 845, premium: 52, royale: 5, mrr: 1847 },
          analytics: { pageViews: 45230, clickOuts: 3420, favorites: 892, searches: 12450 },
          ai: { conversations: 2341, tokensUsed: 1250000, cost: 12.50 }
        });
      }
      
      setRecentActivity([
        { id: '1', type: 'brand_created', message: 'Nouvelle marque : Le Slip Français', time: 'Il y a 2h' },
        { id: '2', type: 'user_signup', message: 'Nouvel utilisateur inscrit', time: 'Il y a 3h' },
        { id: '3', type: 'subscription', message: 'Upgrade Premium : Maison Château Rouge', time: 'Il y a 5h' },
        { id: '4', type: 'favorite', message: '15 nouveaux favoris ajoutés', time: 'Il y a 6h' },
      ]);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setStats({
        brands: { total: 902, active: 856, pending: 12, thisMonth: 24 },
        products: { total: 39835, active: 38500, featured: 12 },
        users: { total: 1847, thisMonth: 156, active: 423 },
        subscriptions: { free: 845, premium: 52, royale: 5, mrr: 1847 },
        analytics: { pageViews: 45230, clickOuts: 3420, favorites: 892, searches: 12450 },
        ai: { conversations: 2341, tokensUsed: 1250000, cost: 12.50 }
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, href }: { 
    title: string; value: string | number; subtitle?: string; icon: any; color: string; 
    trend?: { value: number; positive: boolean }; href?: string;
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
      </div>
      {href && (
        <Link href={href} className="mt-4 flex items-center gap-1 text-sm text-france-blue hover:underline">
          Voir détails <ArrowUpRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-france-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme Made in France</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-france-blue text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === 'today' ? "Aujourd'hui" : p === 'week' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Marques" value={stats?.brands.total || 0} subtitle={`${stats?.brands.thisMonth || 0} ce mois`}
          icon={Package} color="bg-france-blue" trend={{ value: 12, positive: true }} href="/admin/marques" />
        <StatCard title="Produits" value={(stats?.products.total || 0).toLocaleString()} subtitle={`${stats?.products.featured || 0} en vedette`}
          icon={ShoppingBag} color="bg-green-500" trend={{ value: 8, positive: true }} href="/admin/produits" />
        <StatCard title="Utilisateurs" value={(stats?.users.total || 0).toLocaleString()} subtitle={`${stats?.users.thisMonth || 0} ce mois`}
          icon={Users} color="bg-purple-500" trend={{ value: 24, positive: true }} href="/admin/utilisateurs" />
        <StatCard title="MRR" value={`${stats?.subscriptions.mrr || 0} €`} subtitle={`${(stats?.subscriptions.premium || 0) + (stats?.subscriptions.royale || 0)} abonnés payants`}
          icon={DollarSign} color="bg-amber-500" trend={{ value: 15, positive: true }} href="/admin/abonnements" />
      </div>

      {/* Section milieu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Abonnements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-france-blue" />
            Abonnements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600">Gratuit</span>
              </div>
              <span className="font-semibold">{stats?.subscriptions.free || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-france-blue"></div>
                <span className="text-gray-600">Premium (29€)</span>
              </div>
              <span className="font-semibold">{stats?.subscriptions.premium || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Royale (99€)</span>
              </div>
              <span className="font-semibold">{stats?.subscriptions.royale || 0}</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Revenu mensuel</span>
              <span className="text-xl font-bold text-green-600">{stats?.subscriptions.mrr || 0} €</span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Analytics (7 jours)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Eye className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Pages vues</span></div>
              <span className="font-semibold">{(stats?.analytics.pageViews || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><MousePointerClick className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Clics sortants</span></div>
              <span className="font-semibold">{(stats?.analytics.clickOuts || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Heart className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Favoris ajoutés</span></div>
              <span className="font-semibold">{stats?.analytics.favorites || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Search className="w-4 h-4 text-gray-400" /><span className="text-gray-600">Recherches</span></div>
              <span className="font-semibold">{(stats?.analytics.searches || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* IA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Assistant IA
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conversations</span>
              <span className="font-semibold">{(stats?.ai.conversations || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tokens utilisés</span>
              <span className="font-semibold">{((stats?.ai.tokensUsed || 0) / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Coût estimé</span>
              <span className="font-semibold text-amber-600">{stats?.ai.cost?.toFixed(2) || 0} €</span>
            </div>
          </div>
          <Link href="/admin/ia" className="mt-6 block w-full text-center py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors">
            Gérer l'IA
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Activité récente
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'brand_created' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'user_signup' ? 'bg-green-100 text-green-600' :
                  activity.type === 'subscription' ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-600'
                }`}>
                  {activity.type === 'brand_created' ? <Package className="w-4 h-4" /> :
                   activity.type === 'user_signup' ? <Users className="w-4 h-4" /> :
                   activity.type === 'subscription' ? <CreditCard className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/marques/new" className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-france-blue hover:bg-france-blue/5 transition-all text-center">
              <Package className="w-8 h-8 mx-auto text-gray-400" />
              <span className="block mt-2 text-sm font-medium text-gray-600">Ajouter une marque</span>
            </Link>
            <Link href="/admin/produits-tendances" className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center">
              <ShoppingBag className="w-8 h-8 mx-auto text-gray-400" />
              <span className="block mt-2 text-sm font-medium text-gray-600">Produits tendances</span>
            </Link>
            <Link href="/admin/studios" className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center">
              <Eye className="w-8 h-8 mx-auto text-gray-400" />
              <span className="block mt-2 text-sm font-medium text-gray-600">Accéder à un Studio</span>
            </Link>
            <Link href="/admin/systeme" className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-400" />
              <span className="block mt-2 text-sm font-medium text-gray-600">État du système</span>
            </Link>
          </div>
        </div>
      </div>

      {/* État des marques */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">État des marques</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{stats?.brands.active || 0}</div>
              <div className="text-sm text-green-600">Actives</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <Clock className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats?.brands.pending || 0}</div>
              <div className="text-sm text-amber-600">En attente</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats?.brands.thisMonth || 0}</div>
              <div className="text-sm text-blue-600">Ce mois</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            <Package className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats?.brands.total || 0}</div>
              <div className="text-sm text-purple-600">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}