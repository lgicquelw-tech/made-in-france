'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Loader2, List, Map as MapIcon } from 'lucide-react';
import { REGION_PATHS, SVG_VIEWBOX, DOMTOM_PATHS, DOMTOM_VIEWBOX } from '@/data/regionPaths';

// Liste des DOM-TOM
const DOMTOM_REGIONS = [
  { slug: 'guadeloupe', name: 'Guadeloupe' },
  { slug: 'martinique', name: 'Martinique' },
  { slug: 'guyane', name: 'Guyane' },
  { slug: 'la-reunion', name: 'La Réunion' },
  { slug: 'mayotte', name: 'Mayotte' },
];

interface RegionWithCount {
  id: string;
  name: string;
  slug: string;
  brandCount: number;
}

// Couleurs fixes pour chaque région
const REGION_COLORS: Record<string, string> = {
  'ile-de-france': '#3B82F6',
  'auvergne-rhone-alpes': '#10B981',
  'nouvelle-aquitaine': '#8B5CF6',
  'occitanie': '#F59E0B',
  'provence-alpes-cote-dazur': '#EC4899',
  'hauts-de-france': '#06B6D4',
  'grand-est': '#6366F1',
  'bretagne': '#14B8A6',
  'normandie': '#F97316',
  'pays-de-la-loire': '#84CC16',
  'bourgogne-franche-comte': '#A855F7',
  'centre-val-de-loire': '#EF4444',
  'corse': '#0EA5E9',
  // DOM-TOM
  'guadeloupe': '#059669',
  'martinique': '#DC2626',
  'guyane': '#7C3AED',
  'la-reunion': '#DB2777',
  'mayotte': '#0891B2',
};

const DEFAULT_COLOR = '#0D2B4E';

// Normalise les slugs pour matcher entre l'API et les paths SVG
const normalizeSlug = (slug: string) => {
  // Gère les variantes comme "provence-alpes-cote-d-azur" vs "provence-alpes-cote-dazur"
  return slug.replace(/-d-/g, '-d').replace(/-d(?=[aeiou])/g, 'd');
};

// Map les slugs API vers les slugs des paths SVG
const API_TO_PATH_SLUG: Record<string, string> = {
  'provence-alpes-cote-d-azur': 'provence-alpes-cote-dazur',
};

const getPathSlug = (apiSlug: string) => API_TO_PATH_SLUG[apiSlug] || apiSlug;

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const response = await fetch('http://localhost:4000/api/v1/regions/with-counts');
        const data = await response.json();
        // Tri alphabétique
        const sortedRegions = (data.data || []).sort((a: RegionWithCount, b: RegionWithCount) =>
          a.name.localeCompare(b.name, 'fr')
        );
        setRegions(sortedRegions);
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, []);

  const totalBrands = regions.reduce((sum, r) => sum + r.brandCount, 0);

  const getRegionColor = (slug: string) => REGION_COLORS[getPathSlug(slug)] || REGION_COLORS[slug] || DEFAULT_COLOR;

  const getRegionBySlug = (slug: string) => regions.find(r => getPathSlug(r.slug) === slug || r.slug === slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero moderne */}
      <section className="relative overflow-hidden">
        {/* Fond avec dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-france-blue via-france-blue/95 to-france-blue/90" />

        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-france-red rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Barre tricolore en haut */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-france-blue" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-france-red" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4">
              <MapPin className="w-4 h-4 text-france-red" />
              <span className="text-white/90 text-sm font-medium">{regions.length} régions • {totalBrands} marques</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Régions de France
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Explorez le savoir-faire unique de chaque territoire français.
            </p>
          </div>
        </div>

        {/* Vague décorative en bas */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60L60 55C120 50 240 40 360 35C480 30 600 30 720 32C840 35 960 40 1080 42C1200 45 1320 45 1380 45L1440 45V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Toggle de vue */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-france-blue text-white shadow-md'
                  : 'text-gray-600 hover:text-france-blue'
              }`}
            >
              <List className="w-4 h-4" />
              Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-france-blue text-white shadow-md'
                  : 'text-gray-600 hover:text-france-blue'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Carte
            </button>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-france-blue animate-spin mb-4" />
            <p className="text-gray-500">Chargement des régions...</p>
          </div>
        ) : viewMode === 'list' ? (
          /* Vue Liste */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => {
              const color = getRegionColor(region.slug);

              return (
                <Link
                  key={region.id}
                  href={`/regions/${region.slug}`}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                >
                  {/* Barre de couleur animée en haut */}
                  <div
                    className="absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                    style={{ backgroundColor: color }}
                  />

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icône avec effet de fond */}
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: color }}
                        >
                          <MapPin className="w-7 h-7" />
                        </div>
                        {/* Halo derrière l'icône */}
                        <div
                          className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10"
                          style={{ backgroundColor: color }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-france-blue transition-colors duration-300">
                          {region.name}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                          Découvrir les marques de la région
                        </p>
                      </div>
                    </div>

                    {/* Footer de la carte */}
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {region.brandCount}
                        </span>
                        <span className="text-gray-600 text-sm">marque{region.brandCount > 1 ? 's' : ''}</span>
                      </div>

                      <div
                        className="flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                        style={{ color }}
                      >
                        Explorer
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Vue Carte */
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Carte SVG */}
            <div className="flex-1 flex justify-center">
              <svg
                viewBox={SVG_VIEWBOX}
                className="w-full max-w-3xl h-auto min-h-[450px]"
                style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.1))' }}
              >
                {/* Fond de la carte */}
                <defs>
                  {Object.entries(REGION_COLORS).map(([slug, color]) => (
                    <filter key={`glow-${slug}`} id={`glow-${slug}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  ))}
                </defs>

                {/* Régions */}
                {Object.entries(REGION_PATHS).map(([pathSlug, path]) => {
                  const region = getRegionBySlug(pathSlug);
                  const color = getRegionColor(pathSlug);
                  const isHovered = hoveredRegion === pathSlug || (region && getPathSlug(hoveredRegion || '') === pathSlug);

                  return (
                    <Link key={pathSlug} href={`/regions/${region?.slug || pathSlug}`}>
                      <g
                        onMouseEnter={() => setHoveredRegion(pathSlug)}
                        onMouseLeave={() => setHoveredRegion(null)}
                        className="cursor-pointer"
                        style={{
                          transition: 'all 0.3s ease',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center',
                        }}
                      >
                        <path
                          d={path}
                          fill={color}
                          stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.5)'}
                          strokeWidth={isHovered ? 3 : 1.5}
                          className="transition-all duration-300"
                          style={{
                            filter: isHovered ? `url(#glow-${pathSlug})` : 'none',
                            opacity: hoveredRegion && !isHovered ? 0.5 : 1,
                          }}
                        />
                      </g>
                    </Link>
                  );
                })}

                </svg>
            </div>

            {/* Panneau d'information */}
            <div className="lg:w-80 w-full lg:mt-32">
              {hoveredRegion ? (
                <div
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in"
                >
                  {/* Header coloré */}
                  <div
                    className="p-6 text-white"
                    style={{ backgroundColor: getRegionColor(hoveredRegion) }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-6 h-6" />
                      <h3 className="text-xl font-bold">
                        {getRegionBySlug(hoveredRegion)?.name}
                      </h3>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-xl font-bold"
                        style={{ backgroundColor: getRegionColor(hoveredRegion) }}
                      >
                        {getRegionBySlug(hoveredRegion)?.brandCount}
                      </span>
                      <div>
                        <p className="text-gray-900 font-semibold">Marques</p>
                        <p className="text-gray-500 text-sm">fabriquent dans cette région</p>
                      </div>
                    </div>

                    <Link
                      href={`/regions/${getRegionBySlug(hoveredRegion)?.slug || hoveredRegion}`}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:opacity-90"
                      style={{ backgroundColor: getRegionColor(hoveredRegion) }}
                    >
                      Explorer la région
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 border-dashed p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Survolez une région</p>
                  <p className="text-gray-400 text-sm mt-1">pour voir ses informations</p>
                </div>
              )}

              {/* Outre-mer */}
              <Link
                href="/regions/outre-mer"
                className="group mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 block hover:shadow-lg hover:border-france-blue/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 group-hover:text-france-blue transition-colors">Outre-mer</h4>
                  <span className="text-xs text-gray-400 group-hover:text-france-blue transition-colors">
                    {DOMTOM_REGIONS.reduce((sum, d) => sum + (regions.find(r => r.slug === d.slug)?.brandCount || 0), 0)} marques →
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {DOMTOM_REGIONS.map((domtom) => {
                    const color = getRegionColor(domtom.slug);
                    const path = DOMTOM_PATHS[domtom.slug];
                    return (
                      <div
                        key={domtom.slug}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-12 h-12 shrink-0 flex items-center justify-center relative transition-all duration-300 group-hover:scale-110"
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          }}
                        >
                          {path ? (
                            <svg
                              viewBox={DOMTOM_VIEWBOX}
                              className="w-full h-full transition-all duration-300"
                              style={{
                                filter: 'drop-shadow(0 0 0 transparent)',
                                transition: 'transform 0.3s ease, filter 0.3s ease',
                              }}
                            >
                              <style>
                                {`.group:hover .domtom-path-${domtom.slug} { filter: drop-shadow(0 0 8px ${color}); }`}
                              </style>
                              <g className={`domtom-path-${domtom.slug} transition-all duration-300`}>
                                <path
                                  d={path}
                                  fill={color}
                                  stroke="#fff"
                                  strokeWidth="1"
                                  className="transition-all duration-300"
                                />
                              </g>
                            </svg>
                          ) : (
                            <span
                              className="w-4 h-4 rounded-full transition-transform duration-300 group-hover:scale-125"
                              style={{ backgroundColor: color }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 text-center leading-tight group-hover:text-gray-700 transition-colors">
                          {domtom.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
