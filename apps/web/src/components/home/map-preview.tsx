import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MapPreview() {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-france-blue/10 text-france-blue text-sm font-medium mb-4">
              <MapPin className="h-4 w-4" />
              Carte interactive
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Explorez le Made in France près de chez vous
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez les marques, ateliers et entreprises françaises sur notre carte 
              interactive. Filtrez par secteur, région ou label pour trouver exactement 
              ce que vous cherchez.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                '500+ marques géolocalisées',
                'Filtres par secteur et label',
                'Informations détaillées en un clic',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-gray-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-france-blue" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8">
              <Link href="/carte">
                Ouvrir la carte
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Map preview image/placeholder */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden shadow-lg">
              {/* France outline placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-3/4 h-3/4 text-france-blue/20"
                  fill="currentColor"
                >
                  <path d="M30,20 L45,15 L60,18 L75,22 L80,35 L78,50 L72,65 L60,75 L45,80 L30,75 L20,60 L18,45 L22,30 Z" />
                </svg>
              </div>
              
              {/* Fake markers */}
              <div className="absolute top-[30%] left-[25%]">
                <div className="h-3 w-3 bg-france-blue rounded-full animate-pulse" />
              </div>
              <div className="absolute top-[20%] left-[55%]">
                <div className="h-3 w-3 bg-france-red rounded-full animate-pulse" />
              </div>
              <div className="absolute top-[45%] left-[45%]">
                <div className="h-3 w-3 bg-france-blue rounded-full animate-pulse" />
              </div>
              <div className="absolute top-[60%] left-[35%]">
                <div className="h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
              </div>
              <div className="absolute top-[55%] left-[60%]">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="absolute top-[35%] left-[70%]">
                <div className="h-3 w-3 bg-amber-500 rounded-full animate-pulse" />
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-xl bg-france-red/10 -z-10" />
            <div className="absolute -top-4 -left-4 h-16 w-16 rounded-xl bg-france-blue/10 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
