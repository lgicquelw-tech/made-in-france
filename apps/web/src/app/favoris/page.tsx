'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { Button } from '@/components/ui/button';

function getFaviconUrl(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export default function FavorisPage() {
  const { data: session, status } = useSession();
  const { favorites, isLoading } = useFavorites();

  // Non connecté
  if (status === 'unauthenticated') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Connectez-vous pour voir vos favoris
            </h1>
            <p className="text-gray-600 mb-8">
              Créez un compte pour sauvegarder vos marques préférées et les retrouver facilement.
            </p>
            <Link href="/connexion">
              <Button size="lg" className="gap-2">
                Se connecter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Chargement
  if (status === 'loading' || isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container py-16">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Liste vide
  if (favorites.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Aucun favori pour le moment
            </h1>
            <p className="text-gray-600 mb-8">
              Explorez les marques Made in France et ajoutez vos préférées à vos favoris !
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/marques">
                <Button size="lg" className="gap-2">
                  Découvrir les marques
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/api/v1/brands/random" onClick={(e) => {
                e.preventDefault();
                fetch('http://localhost:4000/api/v1/brands/random')
                  .then(res => res.json())
                  .then(data => {
                    if (data.data?.slug) {
                      window.location.href = `/marques/${data.data.slug}`;
                    }
                  });
              }}>
                <Button variant="outline" size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Surprends-moi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Liste des favoris
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Heart className="h-6 w-6 text-red-500 fill-current" />
                Mes favoris
              </h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} marque{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const favicon = getFaviconUrl(fav.brand.websiteUrl);
              
              return (
                <div
                  key={fav.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <Link href={`/marques/${fav.brand.slug}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Logo */}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: fav.brand.sectorColor ? `${fav.brand.sectorColor}15` : '#f3f4f6' }}
                        >
                          {favicon ? (
                            <img
                              src={favicon}
                              alt={fav.brand.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-lg font-bold" style={{ color: fav.brand.sectorColor || '#6b7280' }}>
                              {fav.brand.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-france-blue transition-colors">
                            {fav.brand.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {fav.brand.city}{fav.brand.region && `, ${fav.brand.region}`}
                          </p>
                          {fav.brand.sector && (
                            <span 
                              className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: fav.brand.sectorColor ? `${fav.brand.sectorColor}15` : '#f3f4f6',
                                color: fav.brand.sectorColor || '#6b7280'
                              }}
                            >
                              {fav.brand.sector}
                            </span>
                          )}
                        </div>

                        {/* Favorite button */}
                        <FavoriteButton brandId={fav.brandId} size="sm" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}