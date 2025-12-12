'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, ExternalLink } from 'lucide-react';
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

export function FeaturedBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch('http://localhost:4000/api/v1/brands?limit=8');
        const data = await response.json();
        setBrands(data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des marques:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center">Chargement des marques...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Marques à découvrir
            </h2>
            <p className="mt-2 text-gray-600">
              {brands.length} marques françaises dans notre base
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/marques">
              Voir toutes les marques
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <div
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

              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-france-blue hover:underline"
                >
                  Visiter le site
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/marques">
              Voir toutes les marques
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
