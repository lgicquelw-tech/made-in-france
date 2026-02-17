'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Search,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  Loader2,
  Check,
  Info
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

export default function StudioRevendiquerPage() {
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
    setSelectedBrand(null);

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

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleContinue = () => {
    if (selectedBrand) {
      router.push(`/studio/inscription?claim=${selectedBrand.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/studio" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Made in France</span>
              <span className="text-xl font-light text-blue-400 ml-1">Studio</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <Link href="/studio" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Recherchez votre entreprise</h1>
            <p className="text-slate-400">
              Trouvez votre fiche existante pour en prendre le contrôle
            </p>
          </div>

          {/* Search form */}
          {!selectedBrand && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom de votre entreprise..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Rechercher
                </button>
              </form>

              {/* Results */}
              {searched && !loading && (
                <div className="mt-6">
                  {results.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">Aucune entreprise trouvée</p>
                      <Link
                        href="/studio/inscription"
                        className="inline-flex items-center gap-2 text-blue-400 hover:underline"
                      >
                        Créer une nouvelle fiche
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-400 mb-4">
                        {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                      </p>
                      {results.map((brand) => {
                        const logoUrl = getLogoUrl(brand);
                        return (
                          <button
                            key={brand.id}
                            onClick={() => handleSelectBrand(brand)}
                            className="w-full flex items-center gap-4 p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-blue-500 hover:bg-slate-800 transition text-left group"
                          >
                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {logoUrl ? (
                                <img src={logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                              ) : (
                                <Building2 className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{brand.name}</p>
                              <div className="flex items-center gap-3 text-sm text-slate-400">
                                {brand.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {brand.city}
                                  </span>
                                )}
                                {brand.websiteUrl && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {new URL(brand.websiteUrl).hostname}
                                  </span>
                                )}
                              </div>
                            </div>
                            {brand.sector && (
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium text-white flex-shrink-0"
                                style={{ backgroundColor: brand.sector.color }}
                              >
                                {brand.sector.name}
                              </span>
                            )}
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected brand confirmation */}
          {selectedBrand && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-700 flex items-center justify-center overflow-hidden mx-auto mb-4">
                  {getLogoUrl(selectedBrand) ? (
                    <img src={getLogoUrl(selectedBrand)!} alt={selectedBrand.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedBrand.name}</h2>
                {selectedBrand.city && (
                  <p className="text-slate-400 flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedBrand.city}
                  </p>
                )}
              </div>

              {/* Info box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium mb-2">Comment ça fonctionne ?</p>
                    <ol className="text-sm text-slate-300 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                        Créez votre compte avec un email professionnel
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                        Vérifiez votre email ou fournissez un justificatif
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                        Accédez à votre dashboard une fois validé
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedBrand(null)}
                  className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Retour
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Continuer
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Alternative: create new */}
          {!selectedBrand && searched && results.length > 0 && (
            <div className="text-center">
              <p className="text-slate-400 mb-2">Votre entreprise n'apparaît pas ?</p>
              <Link
                href="/studio/inscription"
                className="inline-flex items-center gap-2 text-blue-400 hover:underline font-medium"
              >
                Créer une nouvelle fiche
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}