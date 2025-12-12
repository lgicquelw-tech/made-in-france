'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, ExternalLink, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Toutes les marques
          </h1>
          <p className="text-gray-600">
            {pagination ? `${pagination.total} marques françaises référencées` : 'Chargement...'}
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="container py-6">
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
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20 outline-none transition-all"
              />
            </div>
          </form>

          {/* Filter toggle button (mobile) */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>

          {/* Filters (desktop) */}
          <div className="hidden md:flex gap-4">
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20 outline-none bg-white"
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
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20 outline-none bg-white"
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
          <div className="md:hidden mt-4 p-4 bg-white rounded-xl border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Région</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue outline-none bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label>
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue outline-none bg-white"
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
          </div>
        )}

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-france-blue/10 text-france-blue rounded-full text-sm">
                "{search}"
                <button onClick={() => setSearch('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedRegion && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-france-blue/10 text-france-blue rounded-full text-sm">
                {regions.find(r => r.slug === selectedRegion)?.name}
                <button onClick={() => setSelectedRegion('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedSector && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-france-blue/10 text-france-blue rounded-full text-sm">
                {sectors.find(s => s.slug === selectedSector)?.name}
                <button onClick={() => setSelectedSector('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Brands grid */}
      <div className="container pb-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Chargement des marques...</div>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Aucune marque trouvée</div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-france-blue hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {brands.map((brand) => (
                <Link
                  href={`/marques/${brand.slug}`}
                  key={brand.id}
                  className="group bg-white rounded-2xl p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="relative h-16 w-full mb-4 flex items-center justify-center bg-gray-100 rounded-xl">
                    <div className="text-2xl font-bold text-france-blue">
                      {brand.name.charAt(0)}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {brand.name}
                  </h3>
                  
                  {brand.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {brand.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
                    {brand.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {brand.city}
                      </span>
                    )}
                    {brand.region && (
                      <span className="bg-blue-50 text-france-blue px-2 py-0.5 rounded-full">
                        {brand.region}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
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