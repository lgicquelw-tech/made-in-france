'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  BarChart3,
  Package,
  Settings,
  Eye,
  MousePointer,
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeft,
  Lock,
  Star,
  Crown,
  Users,
  Globe,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  ArrowUpRight,
  Award,
  ArrowDownRight
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ROYALE';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  subscriptionTier: SubscriptionTier;
}

interface Stats {
  views: number;
  clicks: number;
  favorites: number;
  products: number;
}

const PLAN_NAMES: Record<SubscriptionTier, string> = {
  FREE: 'Gratuit',
  PREMIUM: 'Premium',
  ROYALE: 'Royale',
};

const PLAN_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-slate-600',
  PREMIUM: 'bg-blue-600',
  ROYALE: 'bg-amber-500',
};

// Données simulées pour les graphiques
const generateMockData = () => {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const viewsData = days.map(() => Math.floor(Math.random() * 50) + 10);
  const clicksData = days.map(() => Math.floor(Math.random() * 20) + 5);
  
  return {
    weekly: { days, views: viewsData, clicks: clicksData },
    topPages: [
      { name: 'Fiche principale', views: 245, percentage: 45 },
      { name: 'Liste produits', views: 156, percentage: 28 },
      { name: 'Parapluie Classic', views: 89, percentage: 16 },
      { name: 'Contact', views: 61, percentage: 11 },
    ],
    sources: [
      { name: 'Recherche Google', percentage: 42, icon: Globe },
      { name: 'Direct', percentage: 28, icon: Monitor },
      { name: 'Réseaux sociaux', percentage: 18, icon: Users },
      { name: 'Autres', percentage: 12, icon: Globe },
    ],
    devices: [
      { name: 'Mobile', percentage: 58, icon: Smartphone },
      { name: 'Desktop', percentage: 35, icon: Monitor },
      { name: 'Tablette', percentage: 7, icon: Monitor },
    ],
    locations: [
      { name: 'Paris', percentage: 32 },
      { name: 'Lyon', percentage: 15 },
      { name: 'Marseille', percentage: 12 },
      { name: 'Bordeaux', percentage: 8 },
      { name: 'Autres', percentage: 33 },
    ],
    peakHours: [
      { hour: '9h', value: 15 },
      { hour: '10h', value: 25 },
      { hour: '11h', value: 35 },
      { hour: '12h', value: 45 },
      { hour: '13h', value: 30 },
      { hour: '14h', value: 50 },
      { hour: '15h', value: 55 },
      { hour: '16h', value: 45 },
      { hour: '17h', value: 60 },
      { hour: '18h', value: 70 },
      { hour: '19h', value: 55 },
      { hour: '20h', value: 40 },
    ],
  };
};

export default function StudioStatistiquesPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [stats, setStats] = useState<Stats>({ views: 0, clicks: 0, favorites: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [mockData] = useState(generateMockData());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/studio/connexion');
      return;
    }

    if (slug) {
      fetchData();
    }
  }, [slug, status]);

  const fetchData = async () => {
    try {
      const brandRes = await fetch(`${API_URL}/api/v1/brands/${slug}`);
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrand(data.data || data);
      }

      const statsRes = await fetch(`${API_URL}/api/v1/brands/${slug}/dashboard`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogoUrl = (brand: Brand): string | null => {
    if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com')) {
      return brand.logoUrl;
    }
    if (brand.websiteUrl) {
      try {
        const hostname = new URL(brand.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch {
        return null;
      }
    }
    return null;
  };

  const currentPlan = brand?.subscriptionTier || 'FREE';
  const hasAdvancedStats = currentPlan !== 'FREE';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Marque non trouvée</h1>
          <Link href="/studio" className="text-blue-400 hover:underline">Retour</Link>
        </div>
      </div>
    );
  }

  const logoUrl = getLogoUrl(brand);
  const maxViews = Math.max(...mockData.weekly.views);
  const maxPeakHour = Math.max(...mockData.peakHours.map(h => h.value));

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <Link href="/studio" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">MiF</span>
                <span className="text-lg font-light text-blue-400 ml-1">Studio</span>
              </div>
            </Link>
          </div>

          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{brand.name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${PLAN_COLORS[currentPlan]}`}>
                  {currentPlan === 'ROYALE' && <Crown className="w-3 h-3" />}
                  {currentPlan === 'PREMIUM' && <Star className="w-3 h-3" />}
                  {PLAN_NAMES[currentPlan]}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link
              href={`/studio/marque/${slug}`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <BarChart3 className="w-5 h-5" />
              Tableau de bord
            </Link>
            <Link
              href={`/studio/marque/${slug}/statistiques`}
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 text-blue-400 rounded-xl"
            >
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </Link>
            <Link
              href={`/studio/marque/${slug}/produits`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <Package className="w-5 h-5" />
              Produits
            </Link>
            <Link
              href={`/studio/marque/${slug}/labels`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <Award className="w-5 h-5" />
              Labels
            </Link>
            <Link
              href={`/studio/marque/${slug}/parametres`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </Link>
          </nav>

          {currentPlan === 'FREE' && (
            <div className="p-4 border-t border-slate-700">
              <Link
                href={`/studio/marque/${slug}/abonnement`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                <Star className="w-5 h-5" />
                Passer Premium
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studio/marque/${slug}`} className="text-slate-400 hover:text-white lg:hidden">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">Statistiques</h1>
                <p className="text-sm text-slate-400">Analysez vos performances</p>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2 bg-slate-700 rounded-xl p-1">
              {[
                { id: '7d', label: '7 jours' },
                { id: '30d', label: '30 jours' },
                { id: '90d', label: '90 jours' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    period === p.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  +12%
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.views || 260}</p>
              <p className="text-sm text-slate-400">Vues totales</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  +8%
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.clicks || 139}</p>
              <p className="text-sm text-slate-400">Clics vers le site</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <ArrowDownRight className="w-4 h-4" />
                  -3%
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.favorites || 24}</p>
              <p className="text-sm text-slate-400">Ajouts aux favoris</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUpRight className="w-4 h-4" />
                  +15%
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">53%</p>
              <p className="text-sm text-slate-400">Taux de conversion</p>
            </div>
          </div>

          {/* Charts - Premium only */}
          {!hasAdvancedStats ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Débloquez les statistiques avancées
                </h2>
                <p className="text-slate-400 mb-6">
                  Accédez aux graphiques détaillés, sources de trafic, appareils, 
                  localisation des visiteurs et bien plus encore.
                </p>
                <Link
                  href={`/studio/marque/${slug}/abonnement`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  <Star className="w-5 h-5" />
                  Passer Premium
                </Link>
              </div>

              {/* Preview blurred */}
              <div className="mt-8 grid md:grid-cols-2 gap-6 opacity-30 blur-sm pointer-events-none">
                <div className="bg-slate-700 rounded-xl h-64"></div>
                <div className="bg-slate-700 rounded-xl h-64"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Views chart */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-6">Évolution des vues</h2>
                <div className="h-64 flex items-end gap-4">
                  {mockData.weekly.days.map((day, index) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-1">
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${(mockData.weekly.views[index] / maxViews) * 180}px` }}
                        />
                        <div
                          className="w-full bg-green-500 rounded-b"
                          style={{ height: `${(mockData.weekly.clicks[index] / maxViews) * 180}px` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded" />
                    <span className="text-sm text-slate-400">Vues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-sm text-slate-400">Clics</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Top pages */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">Pages les plus vues</h2>
                  <div className="space-y-4">
                    {mockData.topPages.map((page, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">{page.name}</span>
                          <span className="text-sm text-slate-400">{page.views} vues</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${page.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic sources */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">Sources de trafic</h2>
                  <div className="space-y-4">
                    {mockData.sources.map((source, index) => {
                      const Icon = source.icon;
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white">{source.name}</span>
                              <span className="text-sm text-slate-400">{source.percentage}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${source.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Devices */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">Appareils</h2>
                  <div className="flex items-center justify-center gap-8">
                    {mockData.devices.map((device, index) => {
                      const Icon = device.icon;
                      const colors = ['text-blue-400', 'text-green-400', 'text-purple-400'];
                      return (
                        <div key={index} className="text-center">
                          <div className={`w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 ${colors[index]}`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <p className="text-2xl font-bold text-white">{device.percentage}%</p>
                          <p className="text-sm text-slate-400">{device.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Peak hours */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">Heures de pointe</h2>
                  <div className="h-32 flex items-end gap-1">
                    {mockData.peakHours.map((hour, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-purple-600 rounded-t"
                          style={{ height: `${(hour.value / maxPeakHour) * 100}px` }}
                        />
                        <span className="text-xs text-slate-500">{hour.hour}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 md:col-span-2">
                  <h2 className="text-lg font-semibold text-white mb-6">Localisation des visiteurs</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {mockData.locations.map((location, index) => (
                      <div key={index} className="bg-slate-700/50 rounded-xl p-4 text-center">
                        <MapPin className="w-6 h-6 text-red-400 mx-auto mb-2" />
                        <p className="text-lg font-bold text-white">{location.percentage}%</p>
                        <p className="text-sm text-slate-400">{location.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}