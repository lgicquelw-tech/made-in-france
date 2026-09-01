'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  region: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RegionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [regionName, setRegionName] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:4000/api/v1/brands?region=${slug}&page=${currentPage}&limit=12`
        );
        const data = await response.json();
        setBrands(data.data || []);
        setPagination(data.pagination || null);
        
        if (data.data && data.data.length > 0 && data.data[0].region) {
          setRegionName(data.data[0].region);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchData();
    }
  }, [slug, currentPage]);

  const formatSlugToName = (s: string) => {
    return s
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const displayName = regionName || formatSlugToName(slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-france-blue to-blue-700 text-white">
        <div className="container py-12">
          <Link href="/regions" className="inline-flex items-center text-blue-200 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Toutes les régions
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <MapPin className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">{displayName}</h1>
          </div>

          <div className="flex items-center gap-2 text-blue-100">
            <Building2 className="h-5 w-5" />
            <span className="text-lg">
              {pagination?.total || 0} marques dans cette région
            </span>
          </div>
        </div>
      </div>

      <div className="container py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Chargement des marques...</div>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Aucune marque dans cette région</div>
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

                  {brand.city && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {brand.city}
                    </div>
                  )}
                </Link>
              ))}
            </div>

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