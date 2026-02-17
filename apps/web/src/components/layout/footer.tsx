'use client';

import Link from 'next/link';
import { Heart, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';

const footerLinks = {
  decouvrir: {
    title: 'Découvrir',
    links: [
      { name: 'Toutes les marques', href: '/marques' },
      { name: 'Carte interactive', href: '/carte' },
      { name: 'Par secteur', href: '/secteurs' },
      { name: 'Par région', href: '/regions' },
      { name: 'Produits tendances', href: '/produits' },
    ],
  },
  marques: {
    title: 'Pour les marques',
    links: [
      { name: 'Référencer ma marque', href: '/entreprises' },
      { name: 'Espace marque', href: '/studio' },
      { name: 'Nos offres', href: '/offres' },
    ],
  },
  apropos: {
    title: 'À propos',
    links: [
      { name: 'Notre mission', href: '/a-propos' },
      { name: 'Contact', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
  legal: {
    title: 'Légal',
    links: [
      { name: 'Mentions légales', href: '/mentions-legales' },
      { name: 'CGU', href: '/cgu' },
      { name: 'Confidentialité', href: '/confidentialite' },
    ],
  },
};

const stats = [
  { value: '900+', label: 'Marques françaises' },
  { value: '5000+', label: 'Produits référencés' },
  { value: '18', label: 'Régions couvertes' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-france-cream to-white" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-france-blue/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-france-blue/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-france-red/5 rounded-full blur-3xl" />

      <div className="relative container py-16 md:py-20">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-16 p-6 md:p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-soft">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-france-blue mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group mb-6">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-france-blue/20 transition-all duration-300">
                  <span className="text-white font-bold text-lg">MF</span>
                </div>
                {/* Tricolore indicator */}
                <div className="absolute -bottom-1 -right-1 flex h-2 w-5 rounded-full overflow-hidden shadow-sm">
                  <span className="bg-france-blue flex-1" />
                  <span className="bg-white flex-1" />
                  <span className="bg-france-red flex-1" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-france-blue text-xl">Made in France</span>
                <span className="text-xs text-gray-400 font-medium tracking-wider">DÉCOUVRIR LE MEILLEUR</span>
              </div>
            </Link>

            <p className="text-gray-600 mb-6 max-w-sm leading-relaxed">
              La plateforme de référence pour découvrir et soutenir les marques et produits fabriqués en France.
            </p>

            {/* Contact info */}
            <div className="space-y-3">
              <a href="mailto:contact@madeinfrance.fr" className="flex items-center gap-3 text-sm text-gray-500 hover:text-france-blue transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-france-blue/5 flex items-center justify-center group-hover:bg-france-blue/10 transition-colors">
                  <Mail className="w-4 h-4 text-france-blue" />
                </div>
                contact@madeinfrance.fr
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="w-8 h-8 rounded-lg bg-france-blue/5 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-france-blue" />
                </div>
                Paris, France
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-france-blue uppercase tracking-wider mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-france-blue transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="mb-16 p-8 bg-gradient-to-r from-france-blue to-france-blue/90 rounded-3xl text-white relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-france-red rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">Restez informé</h3>
              <p className="text-white/70 text-sm md:text-base">Recevez les dernières marques et tendances Made in France</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 md:w-64 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-france-blue font-semibold rounded-xl hover:bg-france-cream hover:shadow-lg transition-all active:scale-95"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              © {new Date().getFullYear()} Made in France. Tous droits réservés.
            </p>

            {/* French flag divider */}
            <div className="flex h-1 w-20 rounded-full overflow-hidden">
              <span className="bg-france-blue flex-1" />
              <span className="bg-white flex-1 border-y border-gray-200" />
              <span className="bg-france-red flex-1" />
            </div>

            <p className="text-sm text-gray-500 flex items-center gap-2">
              Créé avec <Heart className="w-4 h-4 text-france-red fill-france-red animate-pulse-soft" /> par{' '}
              <a
                href="https://leptitstudio.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-france-blue hover:text-france-red transition-colors inline-flex items-center gap-1"
              >
                Le P'tit Studio
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
