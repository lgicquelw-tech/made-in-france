'use client';

import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import Link from 'next/link';
import { MapPin, X, ExternalLink, Building2, Filter, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  region: string | null;
  websiteUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  labels: string[];
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const LABEL_FILTERS = [
  { id: 'epv', name: 'EPV', fullName: 'Entreprise du Patrimoine Vivant', color: 'bg-amber-500' },
  { id: 'ofg', name: 'OFG', fullName: 'Origine France Garantie', color: 'bg-blue-500' },
  { id: 'artisan', name: 'Artisan', fullName: 'Artisan', color: 'bg-green-500' },
];

export default function CartePage() {
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewState, setViewState] = useState({
    latitude: 46.603354,
    longitude: 1.888334,
    zoom: 5.5,
  });

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch('http://localhost:4000/api/v1/brands/with-coords-and-labels');
        const data = await response.json();
        setAllBrands(data.data || []);
        setFilteredBrands(data.data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  // Filtrer les marques quand les filtres changent
  useEffect(() => {
    if (activeFilters.length === 0) {
      setFilteredBrands(allBrands);
    } else {
      const filtered = allBrands.filter(brand => 
        activeFilters.some(filter => 
          brand.labels.some(label => 
            label.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
      setFilteredBrands(filtered);
    }
  }, [activeFilters, allBrands]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
    setSelectedBrand(null);
  };

  const handleMarkerClick = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    if (brand.latitude && brand.longitude) {
      setViewState(prev => ({
        ...prev,
        latitude: brand.latitude!,
        longitude: brand.longitude!,
        zoom: 10,
      }));
    }
  }, []);

  const getMarkerColor = (labels: string[]) => {
    if (labels.some(l => l.toLowerCase().includes('patrimoine'))) return 'bg-amber-500';
    if (labels.some(l => l.toLowerCase().includes('origine'))) return 'bg-blue-500';
    if (labels.some(l => l.toLowerCase().includes('artisan'))) return 'bg-green-500';
    return 'bg-france-blue';
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Token Mapbox manquant</h1>
          <p className="text-gray-600">Ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans le fichier .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carte des marques</h1>
            <p className="text-gray-600">
              {filteredBrands.length} marques affichées
              {activeFilters.length > 0 && ` (${allBrands.length} au total)`}
            </p>
          </div>
          
          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 mr-2">Filtrer :</span>
            {LABEL_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${activeFilters.includes(filter.id) 
                    ? `${filter.color} text-white` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Award className="h-3.5 w-3.5" />
                {filter.name}
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button
                onClick={() => setActiveFilters([])}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Chargement de la carte...</div>
          </div>
        ) : (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />

            {filteredBrands.map((brand) => (
              brand.latitude && brand.longitude ? (
                <Marker
                  key={brand.id}
                  latitude={brand.latitude}
                  longitude={brand.longitude}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(brand);
                  }}
                >
                  <div className="cursor-pointer transform hover:scale-125 transition-transform">
                    <div className={`${getMarkerColor(brand.labels)} text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold`}>
                      {brand.name.charAt(0)}
                    </div>
                  </div>
                </Marker>
              ) : null
            ))}

            {selectedBrand && selectedBrand.latitude && selectedBrand.longitude && (
              <Popup
                latitude={selectedBrand.latitude}
                longitude={selectedBrand.longitude}
                anchor="bottom"
                onClose={() => setSelectedBrand(null)}
                closeButton={false}
                className="rounded-xl"
                offset={15}
              >
                <div className="p-4 min-w-[250px]">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{selectedBrand.name}</h3>
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Labels */}
                  {selectedBrand.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedBrand.labels.map((label, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedBrand.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {selectedBrand.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedBrand.city}</span>
                    {selectedBrand.region && (
                      <span className="text-france-blue">• {selectedBrand.region}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/marques/${selectedBrand.slug}`}>
                        Voir la fiche
                      </Link>
                    </Button>
                    {selectedBrand.websiteUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={selectedBrand.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Légende</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">E</div>
              <span className="text-gray-600">EPV</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">O</div>
              <span className="text-gray-600">Origine France Garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">A</div>
              <span className="text-gray-600">Artisan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-france-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">M</div>
              <span className="text-gray-600">Autres marques</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
