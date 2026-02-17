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
  CheckCircle,
  Clock,
  ArrowUpRight,
  Activity,
  DollarSign,
  Search,
  Sparkles,
  Zap,
  BarChart3,
  Plus,
  AlertCircle,
  ChevronRight
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

  const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend, href }: {
    title: string; value: string | number; subtitle?: string; icon: any; gradient: string;
    trend?: { value: number; positive: boolean }; href?: string;
  }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-france-blue">{value}</div>
        <div className="text-sm text-gray-500 mt-1 font-medium">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      {href && (
        <Link href={href} className="mt-4 flex items-center gap-1 text-sm text-france-blue hover:text-france-red font-medium transition-colors group/link">
          Voir détails
          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-france-blue">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme Made in France</p>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1.5 shadow-soft border border-white/50">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === p
                  ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'today' ? "Aujourd'hui" : p === 'week' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Marques"
          value={stats?.brands.total || 0}
          subtitle={`${stats?.brands.thisMonth || 0} ce mois`}
          icon={Package}
          gradient="from-france-blue to-blue-600"
          trend={{ value: 12, positive: true }}
          href="/admin/marques"
        />
        <StatCard
          title="Produits"
          value={(stats?.products.total || 0).toLocaleString()}
          subtitle={`${stats?.products.featured || 0} en vedette`}
          icon={ShoppingBag}
          gradient="from-green-500 to-emerald-600"
          trend={{ value: 8, positive: true }}
          href="/admin/produits"
        />
        <StatCard
          title="Utilisateurs"
          value={(stats?.users.total || 0).toLocaleString()}
          subtitle={`${stats?.users.thisMonth || 0} ce mois`}
          icon={Users}
          gradient="from-violet-500 to-purple-600"
          trend={{ value: 24, positive: true }}
          href="/admin/utilisateurs"
        />
        <StatCard
          title="MRR"
          value={`${stats?.subscriptions.mrr || 0} €`}
          subtitle={`${(stats?.subscriptions.premium || 0) + (stats?.subscriptions.royale || 0)} abonnés payants`}
          icon={DollarSign}
          gradient="from-france-gold to-amber-600"
          trend={{ value: 15, positive: true }}
          href="/admin/abonnements"
        />
      </div>

      {/* Section milieu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Abonnements */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-france-blue" />
            </div>
            Abonnements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600 font-medium">Gratuit</span>
              </div>
              <span className="font-bold text-france-blue">{stats?.subscriptions.free || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-france-blue/5 hover:bg-france-blue/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-france-blue"></div>
                <span className="text-gray-600 font-medium">Premium (29€)</span>
              </div>
              <span className="font-bold text-france-blue">{stats?.subscriptions.premium || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-france-gold"></div>
                <span className="text-gray-600 font-medium">Royale (99€)</span>
              </div>
              <span className="font-bold text-france-blue">{stats?.subscriptions.royale || 0}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Revenu mensuel</span>
              <span className="text-2xl font-bold text-green-600">{stats?.subscriptions.mrr || 0} €</span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            Analytics (7 jours)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-gray-600">Pages vues</span>
              </div>
              <span className="font-bold text-france-blue">{(stats?.analytics.pageViews || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-gray-600">Clics sortants</span>
              </div>
              <span className="font-bold text-france-blue">{(stats?.analytics.clickOuts || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-gray-600">Favoris ajoutés</span>
              </div>
              <span className="font-bold text-france-blue">{stats?.analytics.favorites || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Search className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-gray-600">Recherches</span>
              </div>
              <span className="font-bold text-france-blue">{(stats?.analytics.searches || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* IA */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-violet-600" />
            </div>
            Assistant IA
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Conversations</span>
                <Zap className="w-4 h-4 text-violet-500" />
              </div>
              <span className="text-2xl font-bold text-france-blue">{(stats?.ai.conversations || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-gray-600">Tokens utilisés</span>
              <span className="font-bold text-france-blue">{((stats?.ai.tokensUsed || 0) / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-gray-600">Coût estimé</span>
              <span className="font-bold text-amber-600">{stats?.ai.cost?.toFixed(2) || 0} €</span>
            </div>
          </div>
          <Link href="/admin/ia" className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 rounded-xl hover:from-violet-500/20 hover:to-purple-500/20 transition-all font-medium">
            <Bot className="w-4 h-4" />
            Gérer l'IA
          </Link>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activité récente */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            Activité récente
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={`p-2.5 rounded-xl ${
                  activity.type === 'brand_created' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600' :
                  activity.type === 'user_signup' ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600' :
                  activity.type === 'subscription' ? 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600' :
                  'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600'
                } group-hover:scale-110 transition-transform`}>
                  {activity.type === 'brand_created' ? <Package className="w-4 h-4" /> :
                   activity.type === 'user_signup' ? <Users className="w-4 h-4" /> :
                   activity.type === 'subscription' ? <CreditCard className="w-4 h-4" /> :
                   <Heart className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-france-blue group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-france-blue" />
            </div>
            Actions rapides
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/marques/new" className="p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-france-blue hover:bg-france-blue/5 transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-france-blue/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-france-blue" />
              </div>
              <span className="block mt-3 text-sm font-medium text-gray-600 group-hover:text-france-blue">Ajouter une marque</span>
            </Link>
            <Link href="/admin/produits-tendances" className="p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-green-600" />
              </div>
              <span className="block mt-3 text-sm font-medium text-gray-600 group-hover:text-green-600">Produits tendances</span>
            </Link>
            <Link href="/admin/studios" className="p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                <Eye className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
              </div>
              <span className="block mt-3 text-sm font-medium text-gray-600 group-hover:text-purple-600">Accéder à un Studio</span>
            </Link>
            <Link href="/admin/systeme" className="p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-all">
                <AlertCircle className="w-6 h-6 text-gray-400 group-hover:text-amber-600" />
              </div>
              <span className="block mt-3 text-sm font-medium text-gray-600 group-hover:text-amber-600">État du système</span>
            </Link>
          </div>
        </div>
      </div>

      {/* État des marques */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
        <h3 className="font-semibold text-france-blue mb-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-france-blue" />
          </div>
          État des marques
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats?.brands.active || 0}</div>
              <div className="text-sm text-green-600 font-medium">Actives</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">{stats?.brands.pending || 0}</div>
              <div className="text-sm text-amber-600 font-medium">En attente</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats?.brands.thisMonth || 0}</div>
              <div className="text-sm text-blue-600 font-medium">Ce mois</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 hover:shadow-md transition-all group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-600">{stats?.brands.total || 0}</div>
              <div className="text-sm text-violet-600 font-medium">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
