'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';

interface RegionWithCount {
  id: string;
  name: string;
  slug: string;
  brandCount: number;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const response = await fetch('http://localhost:4000/api/v1/regions/with-counts');
        const data = await response.json();
        setRegions(data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des régions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, []);

  // Couleurs pour les cartes de régions
  const regionColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
    'from-orange-500 to-orange-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
    'from-amber-500 to-amber-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-pink-500 to-pink-600',
    'from-lime-500 to-lime-600',
    'from-red-500 to-red-600',
    'from-sky-500 to-sky-600',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Régions de France
            </h1>
            <p className="text-xl text-gray-600">
              Découvrez les marques françaises par région. Chaque territoire possède ses savoir-faire uniques et ses entreprises emblématiques.
            </p>
          </div>
        </div>
      </div>

      {/* Regions grid */}
      <div className="container py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Chargement des régions...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <Link
                key={region.id}
                href={`/regions/${region.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${regionColors[index % regionColors.length]} opacity-90`} />
                
                {/* Content */}
                <div className="relative p-8 text-white">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">
                    {region.name}
                  </h2>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <Building2 className="h-4 w-4" />
                    <span>{region.brandCount} marques</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
