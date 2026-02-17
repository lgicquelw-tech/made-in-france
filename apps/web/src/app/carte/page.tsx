'use client';

import { useEffect, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import Link from 'next/link';
import { MapPin, X, ExternalLink, Filter } from 'lucide-react';
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
  sector: string | null;
  sectorSlug: string | null;
  sectorColor: string;
}

interface Sector {
  slug: string;
  name: string;
  color: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const SECTORS: Sector[] = [
  { slug: 'mode-accessoires', name: 'Mode & Accessoires', color: '#3B82F6' },
  { slug: 'maison-jardin', name: 'Maison & Jardin', color: '#10B981' },
  { slug: 'gastronomie', name: 'Gastronomie', color: '#F59E0B' },
  { slug: 'cosmetique', name: 'Cosmétique', color: '#EC4899' },
  { slug: 'enfance', name: 'Enfance', color: '#8B5CF6' },
  { slug: 'loisirs-sport', name: 'Loisirs & Sport', color: '#06B6D4' },
  { slug: 'animaux', name: 'Animaux', color: '#8B4513' },
  { slug: 'sante-nutrition', name: 'Santé & Nutrition', color: '#22C55E' },
  { slug: 'high-tech', name: 'High-Tech', color: '#6366F1' },
];

export default function CartePage() {
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectors, setActiveSectors] = useState<string[]>([]);
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
    if (activeSectors.length === 0) {
      setFilteredBrands(allBrands);
    } else {
      const filtered = allBrands.filter(brand => 
        brand.sectorSlug && activeSectors.includes(brand.sectorSlug)
      );
      setFilteredBrands(filtered);
    }
  }, [activeSectors, allBrands]);

  const toggleSector = (sectorSlug: string) => {
    setActiveSectors(prev => 
      prev.includes(sectorSlug) 
        ? prev.filter(s => s !== sectorSlug)
        : [...prev, sectorSlug]
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
              {activeSectors.length > 0 && ` (${allBrands.length} au total)`}
            </p>
          </div>
          
          {/* Filtres par secteur */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 mr-2">Secteurs :</span>
            {SECTORS.map(sector => (
              <button
                key={sector.slug}
                onClick={() => toggleSector(sector.slug)}
                style={{
                  backgroundColor: activeSectors.includes(sector.slug) ? sector.color : undefined,
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${activeSectors.includes(sector.slug) 
                    ? 'text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sector.color }}
                />
                {sector.name}
              </button>
            ))}
            {activeSectors.length > 0 && (
              <button
                onClick={() => setActiveSectors([])}
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
                    <div 
                      className="text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold"
                      style={{ backgroundColor: brand.sectorColor || '#002395' }}
                    >
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
                maxWidth="300px"
                offset={15}
              >
                <div className="p-4 w-[280px]">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Logo */}
                    {selectedBrand.websiteUrl && (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: `${selectedBrand.sectorColor}20` }}
                      >
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${new URL(selectedBrand.websiteUrl).hostname}&sz=64`}
                          alt={selectedBrand.name}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg pr-6">{selectedBrand.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className="text-gray-400 hover:text-gray-600 absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Secteur */}
                  {selectedBrand.sector && (
                    <div className="mb-3">
                      <span 
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: selectedBrand.sectorColor }}
                      >
                        {selectedBrand.sector}
                      </span>
                    </div>
                  )}
                  
                  {/* Labels */}
                  {selectedBrand.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedBrand.labels.map((label, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full"
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
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{selectedBrand.city}</span>
                    {selectedBrand.region && (
                      <span className="text-france-blue truncate">• {selectedBrand.region}</span>
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
        <div className="absolute bottom-6 left-6 hidden md:block bg-white rounded-xl shadow-lg p-4 max-h-80 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Secteurs</h3>
          <div className="space-y-2 text-sm">
            {SECTORS.map(sector => (
              <div key={sector.slug} className="flex items-center gap-2">
                <div 
                  className="rounded-full w-4 h-4"
                  style={{ backgroundColor: sector.color }}
                />
                <span className="text-gray-600">{sector.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}