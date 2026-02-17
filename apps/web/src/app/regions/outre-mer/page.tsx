'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DOMTOM_PATHS, DOMTOM_VIEWBOX } from '@/data/regionPaths';

// Liste des DOM-TOM
const DOMTOM_REGIONS = [
  { slug: 'guadeloupe', name: 'Guadeloupe', color: '#059669' },
  { slug: 'martinique', name: 'Martinique', color: '#DC2626' },
  { slug: 'guyane', name: 'Guyane', color: '#7C3AED' },
  { slug: 'la-reunion', name: 'La Réunion', color: '#DB2777' },
  { slug: 'mayotte', name: 'Mayotte', color: '#0891B2' },
];

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  region: string | null;
}

interface RegionCount {
  slug: string;
  name: string;
  count: number;
}

export default function OutreMerPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [regionCounts, setRegionCounts] = useState<RegionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBrands, setTotalBrands] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Récupérer les marques de tous les DOM-TOM
        const slugsToFetch = selectedTerritory ? [selectedTerritory] : DOMTOM_REGIONS.map(r => r.slug);

        const allBrands: Brand[] = [];
        const counts: RegionCount[] = [];

        for (const region of DOMTOM_REGIONS) {
          const response = await fetch(
            `http://localhost:4000/api/v1/brands?region=${region.slug}&limit=100`
          );
          const data = await response.json();
          const regionBrands = data.data || [];
          counts.push({
            slug: region.slug,
            name: region.name,
            count: data.pagination?.total || regionBrands.length,
          });

          if (!selectedTerritory || selectedTerritory === region.slug) {
            allBrands.push(...regionBrands);
          }
        }

        setRegionCounts(counts);
        setTotalBrands(counts.reduce((sum, c) => sum + c.count, 0));

        // Pagination côté client
        const itemsPerPage = 12;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedBrands = allBrands.slice(startIndex, startIndex + itemsPerPage);

        setBrands(paginatedBrands);
        setTotalPages(Math.ceil(allBrands.length / itemsPerPage));
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentPage, selectedTerritory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-france-blue via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        {/* Motifs décoratifs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-france-red rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container py-12 relative">
          <Link href="/regions" className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les régions
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MapPin className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">Outre-mer</h1>
          </div>

          <div className="flex items-center gap-2 text-blue-100 mb-8">
            <Building2 className="h-5 w-5" />
            <span className="text-lg">
              {totalBrands} marques dans les territoires d'outre-mer
            </span>
          </div>

          {/* Mini-cartes des territoires */}
          <div className="flex flex-wrap gap-4">
            {DOMTOM_REGIONS.map((region) => {
              const path = DOMTOM_PATHS[region.slug];
              const count = regionCounts.find(c => c.slug === region.slug)?.count || 0;
              const isSelected = selectedTerritory === region.slug;

              return (
                <button
                  key={region.slug}
                  onClick={() => {
                    setSelectedTerritory(isSelected ? null : region.slug);
                    setCurrentPage(1);
                  }}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-white text-gray-900 shadow-lg scale-105'
                      : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    {path && (
                      <svg
                        viewBox={DOMTOM_VIEWBOX}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 8px ${region.color})` : 'none',
                        }}
                      >
                        <path
                          d={path}
                          fill={region.color}
                          stroke={isSelected ? region.color : '#fff'}
                          strokeWidth="1"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-white'}`}>
                      {region.name}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-gray-500' : 'text-blue-200'}`}>
                      {count} marque{count > 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container py-12">
        {selectedTerritory && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-gray-500">Filtré par :</span>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: DOMTOM_REGIONS.find(r => r.slug === selectedTerritory)?.color }}
            >
              {DOMTOM_REGIONS.find(r => r.slug === selectedTerritory)?.name}
              <button
                onClick={() => {
                  setSelectedTerritory(null);
                  setCurrentPage(1);
                }}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Chargement des marques...</div>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Aucune marque dans les territoires d'outre-mer</div>
            <p className="text-gray-400 mt-2">Les marques d'outre-mer seront bientôt ajoutées !</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {brands.map((brand) => {
                const territory = DOMTOM_REGIONS.find(r =>
                  r.name.toLowerCase() === brand.region?.toLowerCase() ||
                  r.slug === brand.region?.toLowerCase().replace(/\s+/g, '-')
                );

                return (
                  <Link
                    href={`/marques/${brand.slug}`}
                    key={brand.id}
                    className="group bg-white rounded-2xl p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="relative h-16 w-full mb-4 flex items-center justify-center bg-gray-100 rounded-xl">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: territory?.color || '#0D2B4E' }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-france-blue transition-colors">
                      {brand.name}
                    </h3>

                    {brand.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {brand.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {brand.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {brand.city}
                        </div>
                      )}
                      {territory && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: territory.color }}
                        >
                          {territory.name}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
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
                  Page {currentPage} sur {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
