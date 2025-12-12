import Link from 'next/link';
import {
  Shirt,
  Home,
  UtensilsCrossed,
  Sparkles,
  Baby,
  Laptop,
  Dumbbell,
  Flower2,
  Hammer,
} from 'lucide-react';

const sectors = [
  {
    name: 'Mode',
    slug: 'mode',
    icon: Shirt,
    count: 156,
    color: 'bg-purple-500',
  },
  {
    name: 'Maison',
    slug: 'maison',
    icon: Home,
    count: 89,
    color: 'bg-amber-500',
  },
  {
    name: 'Gastronomie',
    slug: 'gastronomie',
    icon: UtensilsCrossed,
    count: 124,
    color: 'bg-red-500',
  },
  {
    name: 'Cosmétiques',
    slug: 'cosmetiques',
    icon: Sparkles,
    count: 67,
    color: 'bg-pink-500',
  },
  {
    name: 'Enfants',
    slug: 'enfants',
    icon: Baby,
    count: 45,
    color: 'bg-cyan-500',
  },
  {
    name: 'High-Tech',
    slug: 'high-tech',
    icon: Laptop,
    count: 23,
    color: 'bg-blue-500',
  },
  {
    name: 'Sport & Loisirs',
    slug: 'sport-loisirs',
    icon: Dumbbell,
    count: 34,
    color: 'bg-green-500',
  },
  {
    name: 'Jardin',
    slug: 'jardin-exterieur',
    icon: Flower2,
    count: 28,
    color: 'bg-lime-500',
  },
  {
    name: 'Artisanat',
    slug: 'artisanat',
    icon: Hammer,
    count: 78,
    color: 'bg-yellow-600',
  },
];

export function SectorsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Explorez par secteur
          </h2>
          <p className="mt-2 text-gray-600">
            Trouvez des marques françaises dans votre domaine d'intérêt
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {sectors.map((sector) => (
            <Link
              key={sector.slug}
              href={`/secteurs/${sector.slug}`}
              className="group flex flex-col items-center p-4 rounded-xl bg-white transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div
                className={`${sector.color} p-3 rounded-xl text-white mb-3 group-hover:scale-110 transition-transform`}
              >
                <sector.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {sector.name}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {sector.count} marques
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
