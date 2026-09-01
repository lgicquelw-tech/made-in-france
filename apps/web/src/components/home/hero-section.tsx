'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marques?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marques');
    }
  };

  const popularSearches = [
    'Saint James',
    'Opinel',
    'Bretagne',
    'Cosmétiques',
    'Artisan',
  ];

  return (
    <section className="relative bg-gradient-to-br from-france-blue via-blue-600 to-blue-800 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-9xl">🇫🇷</div>
        <div className="absolute bottom-20 right-10 text-9xl">🏭</div>
        <div className="absolute top-40 right-1/4 text-6xl">⚜️</div>
      </div>

      <div className="container relative py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">+ de 890 marques françaises référencées</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Découvrez le meilleur du
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white">
              Made in France
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Trouvez des marques françaises authentiques, soutenez l'économie locale et consommez responsable.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une marque, un produit, une région..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 rounded-l-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>
              <Button
                type="submit"
                className="h-full px-8 py-5 rounded-r-2xl bg-france-red hover:bg-red-700 text-lg font-semibold"
              >
                Rechercher
              </Button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-blue-200 text-sm">Recherches populaires :</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  router.push(`/marques?search=${encodeURIComponent(term)}`);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/20 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold">890+</div>
              <div className="text-blue-200 text-sm mt-1">Marques</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">13</div>
              <div className="text-blue-200 text-sm mt-1">Régions</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-blue-200 text-sm mt-1">Français</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}