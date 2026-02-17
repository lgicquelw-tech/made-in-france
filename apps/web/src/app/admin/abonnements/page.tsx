'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, TrendingUp, Crown, Star, DollarSign, ExternalLink, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Subscription {
  id: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  tier: 'FREE' | 'PREMIUM' | 'ROYALE';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string | null;
  mrr: number;
  stripeCustomerId: string | null;
  createdAt: string;
}

interface Stats {
  totalMrr: number;
  totalSubscribers: number;
  free: number;
  premium: number;
  royale: number;
  churnRate: number;
  growthRate: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'premium' | 'royale' | 'free'>('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.data);
        setStats(data.stats);
      } else {
        setStats({
          totalMrr: 1847,
          totalSubscribers: 902,
          free: 845,
          premium: 52,
          royale: 5,
          churnRate: 2.3,
          growthRate: 15.4
        });
        setSubscriptions([
          { id: '1', brandId: 'b1', brandName: 'Le Slip Français', brandSlug: 'le-slip-francais', tier: 'ROYALE', status: 'active', currentPeriodEnd: '2024-02-15', mrr: 99, stripeCustomerId: 'cus_xxx1', createdAt: '2023-06-15' },
          { id: '2', brandId: 'b2', brandName: 'Saint James', brandSlug: 'saint-james', tier: 'ROYALE', status: 'active', currentPeriodEnd: '2024-02-20', mrr: 99, stripeCustomerId: 'cus_xxx2', createdAt: '2023-08-10' },
          { id: '3', brandId: 'b3', brandName: 'Maison Château Rouge', brandSlug: 'maison-chateau-rouge', tier: 'PREMIUM', status: 'active', currentPeriodEnd: '2024-02-18', mrr: 29, stripeCustomerId: 'cus_xxx3', createdAt: '2023-11-05' },
          { id: '4', brandId: 'b4', brandName: 'Veja', brandSlug: 'veja', tier: 'PREMIUM', status: 'active', currentPeriodEnd: '2024-02-22', mrr: 29, stripeCustomerId: 'cus_xxx4', createdAt: '2023-12-01' },
          { id: '5', brandId: 'b5', brandName: 'Faguo', brandSlug: 'faguo', tier: 'PREMIUM', status: 'past_due', currentPeriodEnd: '2024-01-15', mrr: 29, stripeCustomerId: 'cus_xxx5', createdAt: '2023-09-20' },
        ]);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ROYALE': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      case 'PREMIUM': return 'bg-gradient-to-r from-france-blue to-blue-600 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Actif' };
      case 'canceled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Annulé' };
      case 'past_due': return { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Impayé' };
      case 'trialing': return { color: 'bg-blue-100 text-blue-700', icon: Star, label: 'Essai' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status };
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return sub.tier !== 'FREE';
    return sub.tier === filter.toUpperCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abonnements</h1>
          <p className="text-gray-500 mt-1">Gestion des revenus et abonnements Stripe</p>
        </div>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-xl hover:bg-[#5851ea] transition-colors">
          <CreditCard className="w-4 h-4" />
          Stripe Dashboard
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className="flex items-center gap-1 text-green-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+{stats?.growthRate || 0}%</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-4xl font-bold">{stats?.totalMrr || 0} €</div>
            <div className="text-green-100 mt-1">MRR (Revenu mensuel)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-france-blue/10 rounded-xl">
              <Star className="w-6 h-6 text-france-blue" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats?.premium || 0}</div>
              <div className="text-sm text-gray-500">Premium (29€/mois)</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">= {(stats?.premium || 0) * 29} €/mois</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats?.royale || 0}</div>
              <div className="text-sm text-gray-500">Royale (99€/mois)</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">= {(stats?.royale || 0) * 99} €/mois</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-xl">
              <Building2 className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats?.free || 0}</div>
              <div className="text-sm text-gray-500">Gratuit</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">{((stats?.free || 0) / (stats?.totalSubscribers || 1) * 100).toFixed(0)}% du total</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Répartition des revenus</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Premium</span>
              <span className="text-sm text-gray-500">{(stats?.premium || 0) * 29} € ({((stats?.premium || 0) * 29 / (stats?.totalMrr || 1) * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-france-blue rounded-full" style={{ width: `${(stats?.premium || 0) * 29 / (stats?.totalMrr || 1) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Royale</span>
              <span className="text-sm text-gray-500">{(stats?.royale || 0) * 99} € ({((stats?.royale || 0) * 99 / (stats?.totalMrr || 1) * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats?.royale || 0) * 99 / (stats?.totalMrr || 1) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'Tous les payants', count: (stats?.premium || 0) + (stats?.royale || 0) },
          { key: 'royale', label: 'Royale', count: stats?.royale || 0 },
          { key: 'premium', label: 'Premium', count: stats?.premium || 0 },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key as 'all' | 'premium' | 'royale')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === tab.key ? 'bg-france-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">MRR</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Prochain paiement</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Client depuis</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSubscriptions.map((sub) => {
                const statusInfo = getStatusBadge(sub.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/marques/${sub.brandId}`} className="font-medium text-gray-900 hover:text-france-blue">{sub.brandName}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierBadge(sub.tier)}`}>
                        {sub.tier === 'ROYALE' && <Crown className="w-3 h-3 inline mr-1" />}
                        {sub.tier === 'PREMIUM' && <Star className="w-3 h-3 inline mr-1" />}
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{sub.mrr} €</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.currentPeriodEnd)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(sub.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/studios/${sub.brandId}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Accéder au Studio">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </Link>
                        <a href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir sur Stripe">
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}