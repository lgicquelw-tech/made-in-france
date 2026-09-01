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
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Flame,
  Tag,
  Sparkles,
  Edit,
  Trash2,
  Lock,
  Star,
  Crown,
  Check,
  X,
  Loader2,
  ChevronDown,
  TrendingUp,
  Award,
  Image as ImageIcon
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ROYALE';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  imageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  isTrending: boolean;
  isNewProduct: boolean;
  isOnSale: boolean;
  salePrice: number | null;
  category: { name: string } | null;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  subscriptionTier: SubscriptionTier;
}

const PLAN_LIMITS = {
  FREE: { maxProducts: 5, trending: false, promo: false, newBadge: false },
  PREMIUM: { maxProducts: 100, trending: true, promo: true, newBadge: true },
  ROYALE: { maxProducts: -1, trending: true, promo: true, newBadge: true }, // -1 = illimité
};

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

export default function StudioProduitsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

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

      // Fetch products
      const productsRes = await fetch(`${API_URL}/api/v1/brands/${slug}/products/all`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.data || data.products || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`${API_URL}/api/v1/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, status: newStatus } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const toggleTrending = async (product: Product) => {
    if (!planLimits.trending) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrending: !product.isTrending }),
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, isTrending: !p.isTrending } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling trending:', error);
    }
  };

  const toggleNewProduct = async (product: Product) => {
    if (!planLimits.newBadge) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNewProduct: !product.isNewProduct }),
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, isNewProduct: !p.isNewProduct } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling new product:', error);
    }
  };

  const togglePromo = async (product: Product, salePrice?: number) => {
    if (!planLimits.promo) return;
    
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isOnSale: !product.isOnSale,
          salePrice: !product.isOnSale ? salePrice : null
        }),
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, isOnSale: !p.isOnSale, salePrice: !p.isOnSale ? salePrice || null : null } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling promo:', error);
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
  const planLimits = PLAN_LIMITS[currentPlan];

  const filteredProducts = products
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const canAddMore = planLimits.maxProducts === -1 || activeProducts < planLimits.maxProducts;

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

          {/* Brand info */}
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

          {/* Navigation */}
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
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 text-blue-400 rounded-xl"
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

          {/* Upgrade CTA */}
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
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">Produits</h1>
              <p className="text-sm text-slate-400">
                {activeProducts} produit{activeProducts > 1 ? 's' : ''} actif{activeProducts > 1 ? 's' : ''}
                {planLimits.maxProducts !== -1 && ` / ${planLimits.maxProducts} max`}
              </p>
            </div>
            <button
              disabled={!canAddMore}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                canAddMore 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-5 h-5" />
              Ajouter un produit
            </button>
          </div>
        </header>

        {/* Limite atteinte warning */}
        {!canAddMore && (
          <div className="mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <p className="text-amber-400">
                Vous avez atteint la limite de {planLimits.maxProducts} produits actifs.
              </p>
            </div>
            <Link
              href={`/studio/marque/${slug}/abonnement`}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
            >
              Passer Premium
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status === 'all' ? 'Tous' : status === 'ACTIVE' ? 'Actifs' : 'Masqués'}
              </button>
            ))}
          </div>
        </div>

        {/* Feature badges legend */}
        <div className="px-6 pb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${planLimits.trending ? 'bg-orange-500/20' : 'bg-slate-700'}`}>
              <Flame className={`w-4 h-4 ${planLimits.trending ? 'text-orange-400' : 'text-slate-500'}`} />
            </div>
            <span className={planLimits.trending ? 'text-slate-300' : 'text-slate-500'}>
              Tendance {!planLimits.trending && <Lock className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${planLimits.newBadge ? 'bg-green-500/20' : 'bg-slate-700'}`}>
              <Sparkles className={`w-4 h-4 ${planLimits.newBadge ? 'text-green-400' : 'text-slate-500'}`} />
            </div>
            <span className={planLimits.newBadge ? 'text-slate-300' : 'text-slate-500'}>
              Nouveauté {!planLimits.newBadge && <Lock className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${planLimits.promo ? 'bg-red-500/20' : 'bg-slate-700'}`}>
              <Tag className={`w-4 h-4 ${planLimits.promo ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            <span className={planLimits.promo ? 'text-slate-300' : 'text-slate-500'}>
              Promo {!planLimits.promo && <Lock className="w-3 h-3 inline ml-1" />}
            </span>
          </div>
        </div>

        {/* Products grid */}
        <div className="px-6 pb-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Aucun produit</h3>
              <p className="text-slate-400 mb-6">
                {searchQuery ? 'Aucun produit ne correspond à votre recherche.' : 'Commencez par ajouter vos premiers produits.'}
              </p>
              {!searchQuery && canAddMore && (
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Plus className="w-5 h-5" />
                  Ajouter un produit
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-slate-800 rounded-xl border ${
                    product.status === 'ACTIVE' ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
                  } overflow-hidden group`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-slate-700 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-slate-600" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {product.isTrending && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Tendance
                        </span>
                      )}
                      {product.isNewProduct && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Nouveau
                        </span>
                      )}
                      {product.isOnSale && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Promo
                        </span>
                      )}
                    </div>

                    {/* Status toggle */}
                    <button
                      onClick={() => toggleProductStatus(product)}
                      className={`absolute top-2 right-2 p-2 rounded-lg transition ${
                        product.status === 'ACTIVE'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-600 text-slate-300'
                      }`}
                      title={product.status === 'ACTIVE' ? 'Masquer' : 'Afficher'}
                    >
                      {product.status === 'ACTIVE' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-white truncate mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      {product.isOnSale && product.salePrice ? (
                        <>
                          <span className="text-red-400 font-semibold">{product.salePrice}€</span>
                          <span className="text-slate-500 line-through text-sm">{product.price}€</span>
                        </>
                      ) : product.price ? (
                        <span className="text-slate-300">{product.price}€</span>
                      ) : (
                        <span className="text-slate-500">Prix non défini</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleTrending(product)}
                        disabled={!planLimits.trending}
                        className={`flex-1 p-2 rounded-lg transition flex items-center justify-center gap-1 ${
                          !planLimits.trending
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : product.isTrending
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-700 text-slate-400 hover:text-orange-400'
                        }`}
                        title={planLimits.trending ? 'Marquer tendance' : 'Premium requis'}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleNewProduct(product)}
                        disabled={!planLimits.newBadge}
                        className={`flex-1 p-2 rounded-lg transition flex items-center justify-center gap-1 ${
                          !planLimits.newBadge
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : product.isNewProduct
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-700 text-slate-400 hover:text-green-400'
                        }`}
                        title={planLimits.newBadge ? 'Marquer nouveau' : 'Premium requis'}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => togglePromo(product)}
                        disabled={!planLimits.promo}
                        className={`flex-1 p-2 rounded-lg transition flex items-center justify-center gap-1 ${
                          !planLimits.promo
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : product.isOnSale
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-700 text-slate-400 hover:text-red-400'
                        }`}
                        title={planLimits.promo ? 'Mettre en promo' : 'Premium requis'}
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button
                        className="flex-1 p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}