import { Heart, MapPin, Award, Users, Target, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-france-blue to-blue-700 text-white">
        <div className="container py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              À propos de Made in France
            </h1>
            <p className="text-xl text-blue-100">
              Une plateforme dédiée à la découverte et à la promotion des marques françaises. 
              Notre mission : valoriser le savoir-faire français et encourager une consommation locale et responsable.
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre mission</h2>
          <div className="prose prose-lg text-gray-600">
            <p>
              Made in France est né d'une conviction simple : la France regorge de marques 
              exceptionnelles, d'artisans passionnés et d'entreprises engagées qui méritent 
              d'être connues et soutenues.
            </p>
            <p>
              Face à la mondialisation et à la standardisation des produits, nous croyons 
              qu'il est essentiel de préserver et de promouvoir les savoir-faire locaux, 
              l'artisanat d'excellence et les entreprises qui font le choix de produire en France.
            </p>
            <p>
              Notre plateforme référence plus de 890 marques françaises, des grandes maisons 
              historiques aux jeunes créateurs innovants, dans tous les secteurs : mode, 
              gastronomie, cosmétiques, maison, high-tech et bien d'autres.
            </p>
          </div>
        </div>
      </div>

      {/* Valeurs */}
      <div className="bg-white py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Nos valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-france-blue/10 rounded-2xl mb-4">
                <Heart className="h-8 w-8 text-france-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Passion du savoir-faire</h3>
              <p className="text-gray-600">
                Nous célébrons l'excellence artisanale et industrielle française, 
                transmise de génération en génération.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-france-red/10 rounded-2xl mb-4">
                <MapPin className="h-8 w-8 text-france-red" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ancrage territorial</h3>
              <p className="text-gray-600">
                Chaque région de France possède ses spécificités et ses talents. 
                Nous mettons en lumière cette richesse locale.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Consommation responsable</h3>
              <p className="text-gray-600">
                Acheter français, c'est soutenir l'emploi local, réduire son empreinte 
                carbone et privilégier la qualité.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Les labels que nous mettons en avant</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Award className="h-6 w-6 text-france-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Entreprise du Patrimoine Vivant (EPV)
                  </h3>
                  <p className="text-gray-600">
                    Label d'État distinguant les entreprises françaises aux savoir-faire artisanaux 
                    et industriels d'excellence. Ces entreprises perpétuent des techniques rares 
                    et un patrimoine économique unique.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <Award className="h-6 w-6 text-france-red" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Origine France Garantie (OFG)
                  </h3>
                  <p className="text-gray-600">
                    Certification attestant que le produit tire ses caractéristiques essentielles 
                    de France et que 50% minimum de son prix de revient unitaire est acquis en France.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Artisan (CMA)
                  </h3>
                  <p className="text-gray-600">
                    Qualité reconnue par les Chambres de Métiers et de l'Artisanat, 
                    garantissant un savoir-faire manuel et une production à taille humaine.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-france-blue text-white py-16">
        <div className="container text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-3xl font-bold mb-4">Prêt à découvrir le Made in France ?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explorez notre catalogue de plus de 890 marques françaises et trouvez 
            des produits de qualité, fabriqués avec passion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-france-blue hover:bg-blue-50" asChild>
              <Link href="/marques">Découvrir les marques</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/regions">Explorer par région</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Une question ?</h2>
          <p className="text-gray-600 mb-8">
            Vous êtes une marque française et souhaitez être référencée ? 
            Vous avez une suggestion ou une question ? N'hésitez pas à nous contacter.
          </p>
          <Button variant="outline" size="lg">
            Nous contacter
          </Button>
        </div>
      </div>
    </div>
  );
}
