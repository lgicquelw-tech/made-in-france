import Link from 'next/link';
import { Gift, Home, Shirt, UtensilsCrossed, Sparkles } from 'lucide-react';

const inspirations = [
  {
    title: 'Idées cadeaux',
    description: 'Offrez du Made in France',
    icon: Gift,
    href: '/decouvrir/idees-cadeaux',
    color: 'bg-pink-100 text-pink-700',
  },
  {
    title: 'Mode & Accessoires',
    description: 'S\'habiller français',
    icon: Shirt,
    href: '/secteurs/mode',
    color: 'bg-purple-100 text-purple-700',
  },
  {
    title: 'Maison & Déco',
    description: 'Aménager avec style',
    icon: Home,
    href: '/secteurs/maison',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Gastronomie',
    description: 'Saveurs de nos régions',
    icon: UtensilsCrossed,
    href: '/secteurs/gastronomie',
    color: 'bg-red-100 text-red-700',
  },
  {
    title: 'Éco-responsable',
    description: 'Consommer durable',
    icon: Sparkles,
    href: '/decouvrir/eco-responsable',
    color: 'bg-green-100 text-green-700',
  },
];

export function InspirationSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Trouvez l'inspiration
          </h2>
          <p className="mt-2 text-gray-600">
            Explorez nos sélections thématiques
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {inspirations.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-gray-50 transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`p-3 rounded-xl ${item.color} mb-4`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
