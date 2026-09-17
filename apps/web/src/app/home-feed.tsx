'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { ProduitCard, type ProduitCarte } from '@/components/produit-card';
import { aDesPreferences, enQuery, lireSignaux, oublierSignaux, resumer, type Preferences } from '@/lib/signaux';

/**
 * Le fil de produits de l'accueil (REBUILD.md T8.9).
 *
 * La première page arrive **du serveur**, générique : le HTML montre des produits avant
 * qu'un seul octet de JavaScript ne s'exécute. Puis, au montage, si le navigateur garde des
 * signaux (recherches, secteurs, marques), le fil est **rechargé personnalisé** et le dit
 * — un fil qui change sans le dire donne l'impression d'un bug. Ensuite : défilement
 * infini, pages disjointes garanties par l'ordre stable du serveur.
 */
interface Props { initial: ProduitCarte[]; total: number; parPage: number }

export default function HomeFeed({ initial, total, parPage }: Props) {
  const [produits, setProduits] = useState<ProduitCarte[]>(initial);
  const [page, setPage] = useState(1);
  const [totalActuel, setTotalActuel] = useState(total);
  const [chargement, setChargement] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const sentinelle = useRef<HTMLDivElement>(null);
  const dejaPersonnalise = useRef(false);

  const charger = useCallback(async (p: Preferences | null, numero: number, remplacer: boolean) => {
    setChargement(true);
    try {
      const q = new URLSearchParams(p ? enQuery(p) : '');
      q.set('page', String(numero)); q.set('limit', String(parPage));
      const res = await fetch(`/api/v1/feed?${q}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProduits((avant) => (remplacer ? data.data : [...avant, ...data.data]));
      setTotalActuel(data.pagination.total);
      setPage(numero);
    } catch (e) {
      console.error('Fil :', e);
    } finally {
      setChargement(false);
    }
  }, [parPage]);

  // Au montage : les signaux du navigateur, s'il en a.
  useEffect(() => {
    if (dejaPersonnalise.current) return; // le mode strict de React monte deux fois en dev
    dejaPersonnalise.current = true;
    const p = resumer(lireSignaux());
    if (aDesPreferences(p)) { setPrefs(p); void charger(p, 1, true); }
  }, [charger]);

  // Défilement infini.
  useEffect(() => {
    const el = sentinelle.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !chargement && produits.length < totalActuel) void charger(prefs, page + 1, false);
    }, { rootMargin: '600px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [chargement, produits.length, totalActuel, prefs, page, charger]);

  const reinitialiser = () => { oublierSignaux(); setPrefs(null); void charger(null, 1, true); };

  return (
    <section aria-label="Produits" className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          {prefs ? 'Pour vous' : 'Fabriqué en France, aujourd\'hui'}
        </h1>
        {prefs ? (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-france-blue" aria-hidden />
            D'après vos recherches et vos visites — <button type="button" onClick={reinitialiser} className="underline hover:text-gray-900">réinitialiser</button>
          </p>
        ) : (
          <p className="text-sm text-gray-500">{totalActuel.toLocaleString('fr-FR')} produits</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {produits.map((p, i) => <ProduitCard key={p.id} produit={p} priorite={i < 5} />)}
      </div>

      {produits.length === 0 && !chargement && (
        <p className="text-center text-gray-500 py-16">Aucun produit publié pour l'instant.</p>
      )}

      <div ref={sentinelle} className="h-px" />
      {chargement && (
        <p className="flex items-center justify-center gap-2 text-sm text-gray-500 py-8">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement…
        </p>
      )}
      {!chargement && produits.length >= totalActuel && produits.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-8">Vous avez tout vu — {totalActuel.toLocaleString('fr-FR')} produits.</p>
      )}
    </section>
  );
}
