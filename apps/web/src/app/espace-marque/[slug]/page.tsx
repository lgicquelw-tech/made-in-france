'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  story: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  sector: { id: string; name: string; color: string } | null;
  region: { id: string; name: string } | null;
  labels: { id: string; name: string; slug: string }[];
  socialLinks: any;
  aiGeneratedContent: any;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  views: number;
  clicks: number;
  favorites: number;
  products: number;
  conversionRate: string;
}

interface DashboardData {
  brand: Brand;
  stats: Stats;
  userRole: string;
}

export default function EspaceMarqueDashboard() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'edit' | 'products'>('stats');

  // Champs éditables
  const [editForm, setEditForm] = useState({
    description: '',
    story: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    websiteUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setError('Vous devez être connecté pour accéder à cette page.');
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [session, status, slug]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/brands/${slug}/dashboard?userId=${session?.user?.id}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('Vous n\'êtes pas autorisé à accéder à cette marque.');
        } else if (response.status === 404) {
          setError('Marque non trouvée.');
        } else {
          setError('Erreur lors du chargement.');
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      setData(result);

      // Initialiser le formulaire d'édition
      setEditForm({
        description: result.brand.description || '',
        story: result.brand.story || '',
        email: result.brand.email || '',
        phone: result.brand.phone || '',
        address: result.brand.address || '',
        postalCode: result.brand.postalCode || '',
        city: result.brand.city || '',
        websiteUrl: result.brand.websiteUrl || '',
      });

      setLoading(false);
    } catch (err) {
      setError('Erreur de connexion au serveur.');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id || !data) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/brands/${slug}/dashboard?userId=${session.user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        }
      );

      if (response.ok) {
        setSaveMessage('Modifications enregistrées !');
        fetchDashboard(); // Recharger les données
      } else {
        setSaveMessage('Erreur lors de la sauvegarde.');
      }
    } catch (err) {
      setSaveMessage('Erreur de connexion.');
    }

    setSaving(false);
  };

  // États de chargement et erreur
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/marques"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Voir les marques
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { brand, stats, userRole } = data;

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      OWNER: { label: 'Propriétaire', color: 'bg-purple-100 text-purple-800' },
      ADMIN: { label: 'Administrateur', color: 'bg-blue-100 text-blue-800' },
      EDITOR: { label: 'Éditeur', color: 'bg-green-100 text-green-800' },
      VIEWER: { label: 'Lecteur', color: 'bg-gray-100 text-gray-800' },
    };
    return badges[role] || badges.VIEWER;
  };

  const roleBadge = getRoleBadge(userRole);

  // Fonction pour obtenir le logo (favicon si pas de logo valide)
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

  const logoUrl = getLogoUrl(brand);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                  {brand.sector && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: brand.sector.color }}
                    >
                      {brand.sector.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/marques/${brand.slug}`}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                target="_blank"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Voir la page publique</span>
              </Link>
              {userRole !== 'VIEWER' && (
                <Link
                  href={`/espace-marque/${brand.slug}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Modifier ma fiche</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Statistiques
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              disabled={userRole === 'VIEWER'}
            >
              ✏️ Modifier la fiche
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🛍️ Produits ({stats.products})
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglet Stats */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Vue d'ensemble</h2>

            {/* Cartes stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="text-3xl mb-2">👁️</div>
                <div className="text-2xl font-bold text-gray-900">{stats.views}</div>
                <div className="text-sm text-gray-500">Vues ce mois</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="text-3xl mb-2">🖱️</div>
                <div className="text-2xl font-bold text-gray-900">{stats.clicks}</div>
                <div className="text-sm text-gray-500">Clics vers le site</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="text-3xl mb-2">❤️</div>
                <div className="text-2xl font-bold text-gray-900">{stats.favorites}</div>
                <div className="text-sm text-gray-500">Favoris</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-2xl font-bold text-gray-900">{stats.products}</div>
                <div className="text-sm text-gray-500">Produits</div>
              </div>
            </div>

            {/* Message info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>Bientôt disponible :</strong> Des statistiques détaillées avec graphiques, 
                sources de trafic, et comparaison avec la moyenne du secteur.
              </p>
            </div>
          </div>
        )}

        {/* Onglet Édition */}
        {activeTab === 'edit' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Modifier votre fiche</h2>

            {userRole === 'VIEWER' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800">
                  ⚠️ Vous avez un accès en lecture seule. Contactez le propriétaire pour modifier la fiche.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Décrivez votre marque..."
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contact
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@marque.fr"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="01 23 45 67 89"
                    />
                  </div>

                  {/* Site web */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site web
                    </label>
                    <input
                      type="url"
                      value={editForm.websiteUrl}
                      onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.marque.fr"
                    />
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 rue de la République"
                    />
                  </div>

                  {/* Code postal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="75001"
                    />
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paris"
                    />
                  </div>
                </div>

                {/* Bouton sauvegarder */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  {saveMessage && (
                    <span className={saveMessage.includes('Erreur') ? 'text-red-600' : 'text-green-600'}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Onglet Produits */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Vos produits</h2>

            {stats.products === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit</h3>
                <p className="text-gray-600 mb-4">
                  Vos produits seront automatiquement importés depuis votre site web.
                </p>
                <p className="text-sm text-gray-500">
                  Compatible Shopify et WooCommerce
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <p className="text-gray-600 mb-4">
                  Vous avez <strong>{stats.products} produits</strong> référencés sur la plateforme.
                </p>
                <Link
                  href={`/marques/${brand.slug}/produits`}
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Voir tous les produits
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}