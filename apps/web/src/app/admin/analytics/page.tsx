'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Eye, MousePointer, Search, Heart, Users, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const stats = {
    pageViews: { value: 45230, change: 12.5 },
    uniqueVisitors: { value: 12450, change: 8.3 },
    searches: { value: 8920, change: 15.2 },
    outboundClicks: { value: 3420, change: -2.1 },
    favorites: { value: 892, change: 24.5 },
    avgSessionDuration: { value: '3m 42s', change: 5.8 },
  };

  const topBrands = [
    { name: 'Le Slip Français', views: 4520, clicks: 342 },
    { name: 'Veja', views: 3890, clicks: 456 },
    { name: 'Saint James', views: 3210, clicks: 234 },
    { name: 'Armor Lux', views: 2890, clicks: 198 },
    { name: 'Opinel', views: 2340, clicks: 167 },
  ];

  const topSearches = [
    { query: 'chaussures made in france', count: 1234 },
    { query: 'vêtements français', count: 987 },
    { query: 'cosmétiques bio france', count: 756 },
    { query: 'sac cuir français', count: 654 },
    { query: 'jouets fabriqués en france', count: 543 },
  ];

  const StatCard = ({ title, value, change, icon: Icon }: { title: string; value: string | number; change: number; icon: any }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="p-3 bg-france-blue/10 rounded-xl">
          <Icon className="w-6 h-6 text-france-blue" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-sm text-gray-500 mt-1">{title}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Statistiques de la plateforme</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-france-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Pages vues" value={stats.pageViews.value} change={stats.pageViews.change} icon={Eye} />
        <StatCard title="Visiteurs uniques" value={stats.uniqueVisitors.value} change={stats.uniqueVisitors.change} icon={Users} />
        <StatCard title="Recherches" value={stats.searches.value} change={stats.searches.change} icon={Search} />
        <StatCard title="Clics sortants" value={stats.outboundClicks.value} change={stats.outboundClicks.change} icon={MousePointer} />
        <StatCard title="Favoris ajoutés" value={stats.favorites.value} change={stats.favorites.change} icon={Heart} />
        <StatCard title="Durée moyenne" value={stats.avgSessionDuration.value} change={stats.avgSessionDuration.change} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-france-blue" />
            Top marques consultées
          </h3>
          <div className="space-y-4">
            {topBrands.map((brand, index) => (
              <div key={brand.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-france-blue/10 flex items-center justify-center text-france-blue font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{brand.name}</div>
                  <div className="text-sm text-gray-500">{brand.views.toLocaleString()} vues · {brand.clicks} clics</div>
                </div>
                <div className="text-sm text-gray-400">
                  {((brand.clicks / brand.views) * 100).toFixed(1)}% CTR
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-france-blue" />
            Top recherches
          </h3>
          <div className="space-y-4">
            {topSearches.map((search, index) => (
              <div key={search.query} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{search.query}</div>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {search.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-france-blue" />
          Évolution des visites
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {[65, 45, 78, 52, 89, 67, 94, 72, 85, 63, 91, 78, 82, 95].map((value, index) => (
            <div key={index} className="flex-1 bg-france-blue/20 rounded-t-lg hover:bg-france-blue/40 transition-colors" style={{ height: `${value}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-gray-500">
          <span>1 Jan</span>
          <span>7 Jan</span>
          <span>14 Jan</span>
        </div>
      </div>
    </div>
  );
}
