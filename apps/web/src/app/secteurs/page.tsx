import Link from 'next/link';
import { Shirt, Home, UtensilsCrossed, Sparkles, Baby, Dumbbell, PawPrint, Heart, Cpu, ArrowRight, Grid3X3 } from 'lucide-react';

const SECTORS = [
  { slug: 'mode-accessoires', name: 'Mode & Accessoires', color: '#3B82F6', icon: Shirt, description: 'Vêtements, chaussures, maroquinerie, bijoux' },
  { slug: 'maison-jardin', name: 'Maison & Jardin', color: '#10B981', icon: Home, description: 'Décoration, mobilier, linge, vaisselle, jardin' },
  { slug: 'gastronomie', name: 'Gastronomie', color: '#F59E0B', icon: UtensilsCrossed, description: 'Alimentation, boissons, épicerie fine' },
  { slug: 'cosmetique', name: 'Cosmétique', color: '#EC4899', icon: Sparkles, description: 'Cosmétiques, soins, parfums' },
  { slug: 'enfance', name: 'Enfance', color: '#8B5CF6', icon: Baby, description: 'Jouets, vêtements enfants, puériculture' },
  { slug: 'loisirs-sport', name: 'Loisirs & Sport', color: '#06B6D4', icon: Dumbbell, description: 'Sport, jeux, outdoor' },
  { slug: 'animaux', name: 'Animaux', color: '#8B4513', icon: PawPrint, description: 'Accessoires et alimentation pour animaux' },
  { slug: 'sante-nutrition', name: 'Santé & Nutrition', color: '#22C55E', icon: Heart, description: 'Produits de santé, compléments alimentaires' },
  { slug: 'high-tech', name: 'High-Tech', color: '#6366F1', icon: Cpu, description: 'Électronique, objets connectés' },
];

async function getSectorCounts() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/sectors/with-counts', {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const data = await res.json();
    const counts: Record<string, number> = {};
    data.data?.forEach((s: { slug: string; brandCount: number }) => {
      counts[s.slug] = s.brandCount;
    });
    return counts;
  } catch {
    return {};
  }
}

export default async function SecteursPage() {
  const counts = await getSectorCounts();
  const totalBrands = Object.values(counts).reduce((a, b) => a + b, 0);

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
              <Grid3X3 className="w-4 h-4 text-france-red" />
              <span className="text-white/90 text-sm font-medium">{SECTORS.length} secteurs • {totalBrands} marques</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              Secteurs d'activité
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Explorez l'excellence française à travers nos différents secteurs.
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

      {/* Grille des secteurs */}
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((sector, index) => {
            const Icon = sector.icon;
            const count = counts[sector.slug] || 0;

            return (
              <Link
                key={sector.slug}
                href={`/secteurs/${sector.slug}`}
                className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Barre de couleur animée en haut */}
                <div
                  className="absolute top-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                  style={{ backgroundColor: sector.color }}
                />

                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icône avec effet de fond */}
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: sector.color }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      {/* Halo derrière l'icône */}
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10"
                        style={{ backgroundColor: sector.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-france-blue transition-colors duration-300">
                        {sector.name}
                      </h2>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {sector.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer de la carte */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold"
                        style={{ backgroundColor: sector.color }}
                      >
                        {count}
                      </span>
                      <span className="text-gray-600 text-sm">marque{count > 1 ? 's' : ''}</span>
                    </div>

                    <div
                      className="flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                      style={{ color: sector.color }}
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
      </section>
    </div>
  );
}