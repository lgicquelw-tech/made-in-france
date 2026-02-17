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
  ExternalLink,
  Edit,
  LogOut,
  ChevronDown,
  Menu,
  Award,
  X
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const API_URL = 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  sector: { name: string; color: string } | null;
}

interface Stats {
  views: number;
  clicks: number;
  favorites: number;
  products: number;
}

export default function StudioDashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [stats, setStats] = useState<Stats>({ views: 0, clicks: 0, favorites: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/studio/connexion');
      return;
    }

    if (slug) {
      fetchBrandData();
    }
  }, [slug, status]);

  const fetchBrandData = async () => {
    try {
      // Récupérer les données de la marque
      const brandRes = await fetch(`${API_URL}/api/v1/brands/${slug}`);
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrand(data.data || data);
      }

      // Récupérer les stats
      const statsRes = await fetch(`${API_URL}/api/v1/brands/${slug}/dashboard`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching brand data:', error);
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
          <Link href="/studio" className="text-blue-400 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = getLogoUrl(brand);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
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

          {/* Brand selector */}
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
                <p className="text-xs text-slate-400">Propriétaire</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href={`/studio/marque/${slug}`}
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 text-blue-400 rounded-xl"
            >
              <BarChart3 className="w-5 h-5" />
              Tableau de bord
            </Link>
            <Link
              href={`/studio/marque/${slug}/statistiques`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
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

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <Link
              href={`/marques/${slug}`}
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <ExternalLink className="w-5 h-5" />
              Voir la page publique
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-semibold text-white">Tableau de bord</h1>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-slate-700 rounded-xl hover:bg-slate-600 transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-white text-sm hidden sm:block">{session?.user?.name || session?.user?.email}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-lg py-2 z-50">
                  <button
                    onClick={() => signOut({ callbackUrl: '/studio' })}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.views}</p>
                  <p className="text-sm text-slate-400">Vues ce mois</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.clicks}</p>
                  <p className="text-sm text-slate-400">Clics vers le site</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.favorites}</p>
                  <p className="text-sm text-slate-400">Favoris</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.products}</p>
                  <p className="text-sm text-slate-400">Produits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <Link
                  href={`/studio/marque/${slug}/produits`}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Gérer les produits</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90" />
                </Link>
                <Link
                  href={`/studio/marque/${slug}/parametres`}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Edit className="w-5 h-5 text-green-400" />
                    <span className="text-white">Modifier la fiche</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90" />
                </Link>
                <Link
                  href={`/marques/${slug}`}
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-purple-400" />
                    <span className="text-white">Voir la page publique</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 -rotate-90" />
                </Link>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Évolution des vues</h2>
              <div className="flex items-center justify-center h-48 text-slate-500">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>Graphique bientôt disponible</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}