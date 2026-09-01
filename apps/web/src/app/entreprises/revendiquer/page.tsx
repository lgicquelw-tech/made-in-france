'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Building2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  sector: { name: string; color: string } | null;
}

export default function RevendiquerPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/brands/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/entreprises" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {!selectedBrand ? (
          <>
            {/* Titre */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Recherchez votre entreprise
              </h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Votre entreprise est peut-être déjà référencée sur notre plateforme. 
                Recherchez-la pour en prendre le contrôle.
              </p>
            </div>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nom de votre entreprise..."
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rechercher'}
                </button>
              </div>
            </form>

            {/* Résultats */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-gray-600 mt-4">Recherche en cours...</p>
              </div>
            ) : searched && results.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune entreprise trouvée</h3>
                <p className="text-gray-600 mb-6">
                  Votre entreprise n'est pas encore référencée ? Inscrivez-vous gratuitement !
                </p>
                <Link
                  href="/entreprises/inscription"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Créer ma fiche
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">{results.length} résultat(s) trouvé(s)</p>
                {results.map((brand) => {
                  const logoUrl = getLogoUrl(brand);
                  return (
                    <div
                      key={brand.id}
                      className="bg-white rounded-xl border p-4 hover:shadow-lg transition cursor-pointer"
                      onClick={() => setSelectedBrand(brand)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt={brand.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <Building2 className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">{brand.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {brand.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {brand.city}
                              </span>
                            )}
                            {brand.websiteUrl && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {new URL(brand.websiteUrl).hostname}
                              </span>
                            )}
                          </div>
                          {brand.sector && (
                            <span
                              className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: brand.sector.color }}
                            >
                              {brand.sector.name}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Info */}
            <div className="mt-12 text-center">
              <p className="text-gray-500">
                Vous ne trouvez pas votre entreprise ?{' '}
                <Link href="/entreprises/inscription" className="text-blue-600 hover:underline">
                  Créez votre fiche gratuitement
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* Écran de confirmation */
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl border p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
                {getLogoUrl(selectedBrand) ? (
                  <img src={getLogoUrl(selectedBrand)!} alt={selectedBrand.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBrand.name}</h2>
              {selectedBrand.city && (
                <p className="text-gray-600 flex items-center justify-center gap-1 mb-6">
                  <MapPin className="w-4 h-4" />
                  {selectedBrand.city}
                </p>
              )}

              <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Pour réclamer cette fiche, vous devez :</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    Créer un compte avec votre email professionnel
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    Vérifier votre email ou fournir un justificatif
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    Une fois validé, vous aurez accès à votre dashboard
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Retour
                </button>
                <Link
                  href={`/entreprises/inscription?claim=${selectedBrand.slug}`}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Continuer
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}