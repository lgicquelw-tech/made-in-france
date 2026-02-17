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
  TrendingUp,
  Award,
  Plus,
  Check,
  X,
  Lock,
  Star,
  Crown,
  Search,
  Loader2,
  Info
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ROYALE';

interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  subscriptionTier: SubscriptionTier;
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

export default function StudioLabelsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [brandLabels, setBrandLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      // Fetch brand
      const brandRes = await fetch(`${API_URL}/api/v1/brands/${slug}`);
      if (brandRes.ok) {
        const data = await brandRes.json();
        setBrand(data.data || data);
      }

      // Fetch all labels
      const labelsRes = await fetch(`${API_URL}/api/v1/labels`);
      if (labelsRes.ok) {
        const data = await labelsRes.json();
        setAllLabels(data.data || []);
      }

      // Fetch brand labels
      const brandLabelsRes = await fetch(`${API_URL}/api/v1/brands/${slug}/labels`);
      if (brandLabelsRes.ok) {
        const data = await brandLabelsRes.json();
        setBrandLabels(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLabel = async (labelId: string) => {
    if (!brand || currentPlan === 'FREE') return;
    setSaving(labelId);

    try {
      const res = await fetch(`${API_URL}/api/v1/brands/${slug}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId }),
      });

      if (res.ok) {
        const label = allLabels.find(l => l.id === labelId);
        if (label) {
          setBrandLabels([...brandLabels, label]);
        }
      }
    } catch (error) {
      console.error('Error adding label:', error);
    } finally {
      setSaving(null);
    }
  };

  const removeLabel = async (labelId: string) => {
    if (!brand) return;
    setSaving(labelId);

    try {
      const res = await fetch(`${API_URL}/api/v1/brands/${slug}/labels/${labelId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setBrandLabels(brandLabels.filter(l => l.id !== labelId));
      }
    } catch (error) {
      console.error('Error removing label:', error);
    } finally {
      setSaving(null);
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
  const hasLabelsFeature = currentPlan !== 'FREE';

  const filteredLabels = allLabels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLabelAdded = (labelId: string) => brandLabels.some(l => l.id === labelId);

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
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 text-blue-400 rounded-xl"
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
            <div>
              <h1 className="text-xl font-semibold text-white">Labels & Certifications</h1>
              <p className="text-sm text-slate-400">
                {brandLabels.length} label{brandLabels.length > 1 ? 's' : ''} attribué{brandLabels.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        <main className="p-6">
          {!hasLabelsFeature ? (
            /* Locked for Free plan */
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Débloquez les labels & certifications
                </h2>
                <p className="text-slate-400 mb-6">
                  Affichez vos labels de qualité (EPV, Origine France Garantie, Bio, etc.) 
                  sur votre fiche pour rassurer vos clients et valoriser votre savoir-faire.
                </p>
                <Link
                  href={`/studio/marque/${slug}/abonnement`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  <Star className="w-5 h-5" />
                  Passer Premium
                </Link>
              </div>

              {/* Preview */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-30 blur-sm pointer-events-none">
                {allLabels.slice(0, 8).map(label => (
                  <div key={label.id} className="bg-slate-700 rounded-xl p-4 h-24"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Current labels */}
              {brandLabels.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4">Vos labels</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brandLabels.map(label => (
                      <div
                        key={label.id}
                        className="bg-slate-800 rounded-xl border border-green-500/30 p-4 flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{label.name}</p>
                          <p className="text-sm text-slate-400 truncate">{label.description}</p>
                        </div>
                        <button
                          onClick={() => removeLabel(label.id)}
                          disabled={saving === label.id}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                        >
                          {saving === label.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">
                  Sélectionnez les labels et certifications que votre entreprise possède. 
                  Ils seront affichés sur votre fiche publique pour rassurer vos clients.
                </p>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un label..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* All labels */}
              <h2 className="text-lg font-semibold text-white mb-4">Tous les labels disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLabels.map(label => {
                  const isAdded = isLabelAdded(label.id);
                  return (
                    <div
                      key={label.id}
                      className={`bg-slate-800 rounded-xl border p-4 flex items-center gap-4 transition ${
                        isAdded ? 'border-green-500/30' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isAdded ? 'bg-green-500/20' : 'bg-slate-700'
                      }`}>
                        <Award className={`w-6 h-6 ${isAdded ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{label.name}</p>
                        <p className="text-sm text-slate-400 truncate">{label.description}</p>
                      </div>
                      <button
                        onClick={() => isAdded ? removeLabel(label.id) : addLabel(label.id)}
                        disabled={saving === label.id}
                        className={`p-2 rounded-lg transition ${
                          isAdded
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/20'
                        }`}
                      >
                        {saving === label.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}