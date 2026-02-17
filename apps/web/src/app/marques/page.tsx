'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, ChevronLeft, ChevronRight, Filter, X, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/favorite-button';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  region: string | null;
  sector: string | null;
  sectorSlug: string | null;
  sectorColor: string | null;
}

interface Region {
  id: string;
  name: string;
  slug: string;
}

interface Sector {
  id: string;
  name: string;
  slug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MarquesPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Charger les régions et secteurs au démarrage
  useEffect(() => {
    async function loadFilters() {
      try {
        const [regionsRes, sectorsRes] = await Promise.all([
          fetch('http://localhost:4000/api/v1/regions'),
          fetch('http://localhost:4000/api/v1/sectors'),
        ]);
        const regionsData = await regionsRes.json();
        const sectorsData = await sectorsRes.json();
        setRegions(regionsData.data || []);
        setSectors(sectorsData.data || []);
      } catch (error) {
        console.error('Erreur chargement filtres:', error);
      }
    }
    loadFilters();
  }, []);

  // Charger les marques
  useEffect(() => {
    async function fetchBrands() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', '12');

        if (selectedRegion) params.set('region', selectedRegion);
        if (selectedSector) params.set('sector', selectedSector);

        let url = `http://localhost:4000/api/v1/brands?${params.toString()}`;

        if (search) {
          url = `http://localhost:4000/api/v1/search?q=${encodeURIComponent(search)}&${params.toString()}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setBrands(data.data || []);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error('Erreur lors du chargement des marques:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, [currentPage, search, selectedRegion, selectedSector]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedSector('');
    setSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedRegion || selectedSector || search;

  return (
    <div className="min-h-screen bg-france-cream">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-france-blue to-france-blue/90 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-france-red rounded-full blur-3xl translate-y-1/2" />
        </div>

        <div className="relative container py-16 md:py-20">
          <div className="flex items-center gap-3 text-white/70 mb-4">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Annuaire</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Toutes les marques
          </h1>
          <p className="text-xl text-white/70 max-w-2xl">
            {pagination ? `${pagination.total} marques françaises référencées` : 'Découvrez le savoir-faire français'}
          </p>

          {/* Flag bar */}
          <div className="flex h-1 w-24 rounded-full overflow-hidden mt-8">
            <span className="bg-france-blue flex-1 opacity-50" />
            <span className="bg-white flex-1" />
            <span className="bg-france-red flex-1" />
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="container py-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une marque, une ville..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-input"
                />
              </div>
            </form>

            {/* Filter toggle button (mobile) */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden rounded-xl border-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 w-5 h-5 bg-france-red text-white text-xs rounded-full flex items-center justify-center">
                  {[selectedRegion, selectedSector, search].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Filters (desktop) */}
            <div className="hidden md:flex gap-4">
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-france-blue focus:ring-4 focus:ring-france-blue/10 outline-none bg-white text-france-blue font-medium transition-all"
              >
                <option value="">Toutes les régions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.slug}>
                    {region.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-france-blue focus:ring-4 focus:ring-france-blue/10 outline-none bg-white text-france-blue font-medium transition-all"
              >
                <option value="">Tous les secteurs</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.slug}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="md:hidden mt-6 pt-6 border-t border-gray-100 space-y-4 animate-fade-in-up">
              <div>
                <label className="block text-sm font-semibold text-france-blue mb-2">Région</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-france-blue outline-none bg-white"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.slug}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-france-blue mb-2">Secteur</label>
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-france-blue outline-none bg-white"
                >
                  <option value="">Tous les secteurs</option>
                  {sectors.map((sector) => (
                    <option key={sector.id} value={sector.slug}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Filtres actifs:</span>
              {search && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-france-blue/10 text-france-blue rounded-full text-sm font-medium">
                  "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-france-red transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedRegion && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-france-blue/10 text-france-blue rounded-full text-sm font-medium">
                  {regions.find(r => r.slug === selectedRegion)?.name}
                  <button onClick={() => setSelectedRegion('')} className="hover:text-france-red transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedSector && (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-france-blue/10 text-france-blue rounded-full text-sm font-medium">
                  {sectors.find(s => s.slug === selectedSector)?.name}
                  <button onClick={() => setSelectedSector('')} className="hover:text-france-red transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-france-red hover:underline font-medium ml-2"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brands grid */}
      <div className="container pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-soft animate-pulse">
                <div className="h-16 bg-gray-100 rounded-xl mb-4" />
                <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-france-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-france-blue" />
            </div>
            <h3 className="text-xl font-bold text-france-blue mb-2">Aucune marque trouvée</h3>
            <p className="text-gray-500 mb-6">Essayez de modifier vos filtres</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="btn-primary rounded-full">
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="brand-card group relative"
                >
                  {/* Bouton favori */}
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton brandId={brand.id} size="sm" />
                  </div>

                  <Link href={`/marques/${brand.slug}`}>
                    <div
                      className="relative h-20 w-full mb-5 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                      style={{ backgroundColor: brand.sectorColor ? `${brand.sectorColor}12` : '#f3f4f6' }}
                    >
                      {brand.websiteUrl ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(brand.websiteUrl).hostname}&sz=64`}
                          alt={brand.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`text-3xl font-bold ${brand.websiteUrl ? 'hidden' : ''}`}
                        style={{ color: brand.sectorColor || '#0D2B4E' }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                    </div>

                    <h3 className="font-bold text-france-blue text-lg mb-2 pr-10 group-hover:text-france-red transition-colors">
                      {brand.name}
                    </h3>

                    {brand.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                        {brand.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {brand.city && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {brand.city}
                        </span>
                      )}
                      {brand.sector && (
                        <span
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: brand.sectorColor || '#0D2B4E' }}
                        >
                          {brand.sector}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-100 flex items-center text-sm font-medium text-france-blue group-hover:text-france-red transition-colors">
                      Voir la marque
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-2 font-semibold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          currentPage === pageNum
                            ? 'bg-france-blue text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="rounded-xl border-2 font-semibold"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
