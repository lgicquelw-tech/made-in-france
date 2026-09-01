import Link from 'next/link';
import { Shirt, Home, UtensilsCrossed, Sparkles, Baby, Dumbbell, PawPrint, Heart, Cpu } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-france-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Secteurs d'activité</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Découvrez les marques françaises par secteur d'activité
          </p>
        </div>
      </section>

      {/* Grille des secteurs */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const count = counts[sector.slug] || 0;
            
            return (
              <Link
                key={sector.slug}
                href={`/secteurs/${sector.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: sector.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-france-blue transition-colors">
                      {sector.name}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {sector.description}
                    </p>
                    <p className="text-france-blue font-semibold mt-3">
                      {count} marque{count > 1 ? 's' : ''}
                    </p>
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