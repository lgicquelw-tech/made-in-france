'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  Eye,
  MousePointer,
  Star,
  Check,
  ArrowRight,
  Search,
  Shield,
  BarChart3,
  Package,
  ImageIcon,
  Video,
  BadgeCheck,
  Zap,
  Crown
} from 'lucide-react';

const FEATURES_FREE = [
  'Fiche entreprise basique',
  '1 photo de présentation',
  'Lien vers votre site web',
  'Statistiques de vues',
];

const FEATURES_PREMIUM = [
  'Tout du gratuit +',
  'Photos illimitées + vidéo',
  'Produits illimités',
  'Stats complètes (vues, clics, sources)',
  'Badge "Vérifié"',
  'Priorité dans la recherche',
];

const FEATURES_SPONSORED = [
  'Tout du Premium +',
  'Mise en avant sur la homepage',
  'Priorité dans les catégories',
  'Featured dans nos contenus',
  'Support prioritaire',
];

export default function EntreprisesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <Building2 className="w-4 h-4" />
              Espace Entreprises
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Faites rayonner votre savoir-faire français
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez plus de 900 entreprises qui valorisent le Made in France. 
              Gérez votre fiche, vos produits et touchez des milliers de consommateurs engagés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/entreprises/inscription"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
              >
                S'inscrire gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/entreprises/revendiquer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/30 text-white rounded-xl font-semibold hover:bg-blue-500/40 transition border border-white/20"
              >
                <Search className="w-5 h-5" />
                Réclamer ma fiche existante
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '900+', label: 'Entreprises référencées', icon: Building2 },
              { value: '35K+', label: 'Produits Made in France', icon: Package },
              { value: '50K+', label: 'Visiteurs par mois', icon: Eye },
              { value: '100%', label: 'Fabrication française', icon: Shield },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi rejoindre notre plateforme ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nous connectons les entreprises françaises avec des consommateurs qui cherchent activement à acheter local.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: 'Visibilité maximale',
                description: 'Apparaissez dans les recherches de milliers de consommateurs engagés pour le Made in France.',
              },
              {
                icon: BarChart3,
                title: 'Statistiques détaillées',
                description: 'Suivez vos performances : vues, clics, sources de trafic. Optimisez votre présence.',
              },
              {
                icon: Zap,
                title: 'Recherche IA',
                description: 'Notre assistant IA recommande vos produits aux visiteurs selon leurs besoins.',
              },
              {
                icon: Package,
                title: 'Catalogue produits',
                description: 'Présentez tous vos produits avec photos, descriptions et liens d\'achat.',
              },
              {
                icon: BadgeCheck,
                title: 'Badge Vérifié',
                description: 'Gagnez la confiance des consommateurs avec notre badge de vérification.',
              },
              {
                icon: TrendingUp,
                title: 'Boost de référencement',
                description: 'Améliorez votre SEO grâce à notre domaine établi et notre trafic qualifié.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Des formules adaptées à vos besoins
            </h2>
            <p className="text-xl text-gray-600">
              Commencez gratuitement, évoluez selon vos ambitions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Gratuit */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-600 rounded-xl mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Gratuit</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">0€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {FEATURES_FREE.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/entreprises/inscription"
                className="block w-full py-3 text-center bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                Populaire
              </div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">29€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {FEATURES_PREMIUM.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/entreprises/inscription?plan=premium"
                className="block w-full py-3 text-center bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Essai gratuit 14 jours
              </Link>
            </div>

            {/* Sponsorisé */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl mb-4">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Sponsorisé</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">99€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {FEATURES_SPONSORED.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/entreprises/inscription?plan=sponsored"
                className="block w-full py-3 text-center bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition"
              >
                Devenir sponsor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Votre entreprise est déjà référencée ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Réclamez votre fiche en quelques clics et prenez le contrôle de votre présence en ligne.
          </p>
          <Link
            href="/entreprises/revendiquer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            <Search className="w-5 h-5" />
            Rechercher mon entreprise
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-600 mb-4">
            Des questions ? Contactez-nous à{' '}
            <a href="mailto:contact@madeinfrance.fr" className="text-blue-600 hover:underline">
              contact@madeinfrance.fr
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}