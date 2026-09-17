import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';

import HomeFeed from './home-feed';
import type { ProduitCarte } from '@/components/produit-card';
import { brandLogoUrl } from '@/lib/brand-logo';

/**
 * L'accueil (REBUILD.md T8.9) : **des produits d'abord.**
 *
 * Avant : un carrousel plein écran sur une seule marque, un bouton « Recherche IA », des
 * « collections inspirantes », et pas un produit dans le premier écran — 838 lignes en
 * `'use client'`. Maintenant : un composant serveur qui compose quatre blocs, le fil en
 * tête. Seul le fil est interactif.
 */

export interface MarqueMiseEnAvant {
  id: string; name: string; slug: string; description: string | null; city: string | null;
  sector: string | null; sectorColor: string | null; logoUrl: string | null; websiteUrl: string | null;
}
export interface SecteurAccueil { id: string; name: string; slug: string; color: string | null; brandCount: number }

const ICONES: Record<string, string> = {
  'mode-accessoires': '👗', 'maison-jardin': '🏠', gastronomie: '🍽️', cosmetique: '✨', enfance: '🧸',
  'loisirs-sport': '⚽', animaux: '🐾', 'sante-nutrition': '💚', 'high-tech': '💻',
};

interface Props {
  fil: { produits: ProduitCarte[]; total: number; parPage: number };
  marques: MarqueMiseEnAvant[];
  secteurs: SecteurAccueil[];
  nbMarques: number;
}

export default function HomeContent({ fil, marques, secteurs, nbMarques }: Props) {
  return (
    <main className="bg-[#fafaf9]">
      <HomeFeed initial={fil.produits} total={fil.total} parPage={fil.parPage} />

      {/* Secteurs : une rangée compacte, pas une section de 24 rem de haut. */}
      <section aria-labelledby="secteurs" className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="secteurs" className="text-lg font-semibold text-gray-900">Par univers</h2>
          <Link href="/secteurs" className="text-sm text-france-blue hover:underline">Tous les secteurs</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {secteurs.map((s) => (
            <Link key={s.id} href={`/secteurs/${s.slug}`} className="group rounded-xl border border-gray-100 bg-white p-3 text-center hover:border-gray-200 hover:shadow-md transition-all">
              <div className="text-2xl mb-1" aria-hidden>{ICONES[s.slug] ?? '📦'}</div>
              <p className="text-xs font-medium text-gray-900 leading-tight group-hover:text-france-blue">{s.name}</p>
              <p className="text-[11px] text-gray-500">{s.brandCount} marques</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Marques à découvrir : trois cartes, sous le fil. */}
      {marques.length > 0 && (
        <section aria-labelledby="marques" className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="marques" className="text-lg font-semibold text-gray-900">Marques à découvrir</h2>
            <Link href="/marques" className="text-sm text-france-blue hover:underline">{nbMarques.toLocaleString('fr-FR')} marques</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {marques.map((m) => {
              const logo = brandLogoUrl(m, 64);
              return (
                <Link key={m.id} href={`/marques/${m.slug}`} className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-md transition-all">
                  <div className="w-14 h-14 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden bg-white">
                    {/* Favicon de 64 px : pas d'optimiseur pour si petit (T4.10). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logo ? <img src={logo} alt="" className="w-8 h-8 object-contain" /> : <span className="text-xl font-bold" style={{ color: m.sectorColor ?? '#0D2B4E' }}>{m.name.charAt(0)}</span>}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-france-blue">{m.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{[m.city, m.sector].filter(Boolean).join(' · ')}</p>
                    {m.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{m.description}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Carte : une invitation, pas une photo de stock. */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <Link href="/carte" className="group flex items-center justify-between gap-4 rounded-2xl bg-france-blue text-white p-6 md:p-8 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <MapPin className="h-8 w-8 text-france-gold flex-shrink-0" aria-hidden />
            <div>
              <h2 className="text-lg md:text-xl font-semibold">Les marques près de chez vous</h2>
              <p className="text-white/75 text-sm">{nbMarques.toLocaleString('fr-FR')} marques sur la carte, par région et par secteur.</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 flex-shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden />
        </Link>
      </section>
    </main>
  );
}
