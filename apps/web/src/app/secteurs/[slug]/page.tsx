import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTORS: Record<string, { name: string; color: string; description: string }> = {
  'mode-accessoires': { name: 'Mode & Accessoires', color: '#3B82F6', description: 'Vêtements, chaussures, maroquinerie, bijoux' },
  'maison-jardin': { name: 'Maison & Jardin', color: '#10B981', description: 'Décoration, mobilier, linge, vaisselle, jardin' },
  'gastronomie': { name: 'Gastronomie', color: '#F59E0B', description: 'Alimentation, boissons, épicerie fine' },
  'cosmetique': { name: 'Cosmétique', color: '#EC4899', description: 'Cosmétiques, soins, parfums' },
  'enfance': { name: 'Enfance', color: '#8B5CF6', description: 'Jouets, vêtements enfants, puériculture' },
  'loisirs-sport': { name: 'Loisirs & Sport', color: '#06B6D4', description: 'Sport, jeux, outdoor' },
  'animaux': { name: 'Animaux', color: '#8B4513', description: 'Accessoires et alimentation pour animaux' },
  'sante-nutrition': { name: 'Santé & Nutrition', color: '#22C55E', description: 'Produits de santé, compléments alimentaires' },
  'high-tech': { name: 'High-Tech', color: '#6366F1', description: 'Électronique, objets connectés' },
};

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  region: string | null;
  websiteUrl: string | null;
}

async function getBrandsBySector(sectorSlug: string): Promise<Brand[]> {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/brands?sector=${sectorSlug}&limit=100`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function SecteurDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sector = SECTORS[slug];

  if (!sector) {
    notFound();
  }

  const brands = await getBrandsBySector(slug);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section 
        className="text-white py-16"
        style={{ backgroundColor: sector.color }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Link 
            href="/secteurs" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les secteurs
          </Link>
          <h1 className="text-4xl font-bold mb-4">{sector.name}</h1>
          <p className="text-xl text-white/90 max-w-2xl">
            {sector.description}
          </p>
          <p className="mt-4 text-white/80">
            {brands.length} marque{brands.length > 1 ? 's' : ''} dans ce secteur
          </p>
        </div>
      </section>

      {/* Liste des marques */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune marque trouvée dans ce secteur.</p>
            <Button asChild className="mt-4">
              <Link href="/secteurs">Voir tous les secteurs</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marques/${brand.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group border border-gray-100"
              >
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-france-blue transition-colors mb-2">
                  {brand.name}
                </h2>
                
                {brand.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {brand.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{brand.city || brand.region || 'France'}</span>
                  </div>
                  
                  {brand.websiteUrl && (
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}