'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, Crown, Star, Eye, Settings, Package, TrendingUp, Inbox } from 'lucide-react';

/**
 * Les marques réellement gérées par quelqu'un dans le Studio.
 *
 * ⚠️ Cette page lisait `/api/admin/brands` — qui ne renvoie ni propriétaire ni compteurs —
 * et, quand l'appel échouait, **inventait six marques réelles** avec des noms de dirigeants
 * et des adresses e-mail plausibles (Le Slip Français, Veja, Armor Lux…), plus quatre
 * compteurs écrits en dur (902, 5, 52, 127). Tout vient désormais de `/api/admin/studios`,
 * et un échec laisse la page vide en le disant.
 */

interface Proprietaire {
  role: string;
  acceptedAt: string | null;
  user: { name: string | null; email: string | null };
}

interface Studio {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  subscriptionTier: 'FREE' | 'PREMIUM' | 'ROYALE';
  isVerified: boolean;
  owners: Proprietaire[];
  _count: { products: number; views: number };
}

const PALIERS = {
  ROYALE: { class: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white', icon: Crown },
  PREMIUM: { class: 'bg-gradient-to-r from-france-blue to-blue-600 text-white', icon: Star },
  FREE: { class: 'bg-gray-100 text-gray-600', icon: Building2 },
} as const;

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [enAttente, setEnAttente] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [palier, setPalier] = useState<'all' | 'FREE' | 'PREMIUM' | 'ROYALE'>('all');

  useEffect(() => { void charger(); }, []);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/studios');
      if (!res.ok) {
        setErreur('Les studios n’ont pas pu être chargés.');
        return;
      }
      const data = await res.json();
      setStudios(data.data ?? []);
      setEnAttente(data.enAttente ?? 0);
    } catch {
      setErreur('Les studios n’ont pas pu être chargés.');
    } finally {
      setLoading(false);
    }
  };

  const filtres = studios.filter((s) => {
    if (palier !== 'all' && s.subscriptionTier !== palier) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Comptés sur ce qui est affiché, jamais écrits en dur.
  const compteurs = [
    { valeur: studios.length, libelle: 'Marques gérées', icone: Building2, fond: 'bg-gray-100', couleur: 'text-gray-600' },
    { valeur: studios.filter((s) => s.subscriptionTier === 'ROYALE').length, libelle: 'Royale', icone: Crown, fond: 'bg-amber-100', couleur: 'text-amber-600' },
    { valeur: studios.filter((s) => s.subscriptionTier === 'PREMIUM').length, libelle: 'Premium', icone: Star, fond: 'bg-france-blue/10', couleur: 'text-france-blue' },
    { valeur: enAttente, libelle: 'Revendications en attente', icone: Inbox, fond: 'bg-green-100', couleur: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MiF Studios</h1>
          <p className="text-gray-500 mt-1">Les marques dont une personne a la gestion</p>
        </div>
        <Link href="/admin/revendications" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-france-blue text-white font-medium hover:bg-france-blue/90 transition">
          <Inbox className="w-4 h-4" />
          Revendications{enAttente > 0 ? ` (${enAttente})` : ''}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {compteurs.map((c) => (
          <div key={c.libelle} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${c.fond} rounded-lg`}><c.icone className={`w-5 h-5 ${c.couleur}`} /></div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{c.valeur}</div>
                <div className="text-sm text-gray-500">{c.libelle}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Rechercher une marque..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'ROYALE', 'PREMIUM', 'FREE'] as const).map((p) => (
              <button key={p} onClick={() => setPalier(p)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${palier === p ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p === 'all' ? 'Tous' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-france-blue"></div>
          </div>
        ) : erreur ? (
          <p role="alert" className="p-10 text-center text-gray-500">{erreur}</p>
        ) : filtres.length === 0 ? (
          <p className="p-10 text-center text-gray-500">
            Aucune marque n’est gérée par un compte aujourd’hui.{' '}
            <Link href="/admin/revendications" className="text-france-blue underline">Voir les revendications</Link>.
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Marque', 'Plan', 'Propriétaire', 'Produits', 'Vues'].map((t) => (
                  <th key={t} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">{t}</th>
                ))}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtres.map((s) => {
                const info = PALIERS[s.subscriptionTier] ?? PALIERS.FREE;
                const Icone = info.icon;
                const principal = s.owners[0];
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {s.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-500">/{s.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${info.class}`}>
                        <Icone className="w-3 h-3" />
                        {s.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{principal?.user.name ?? '—'}</div>
                      <div className="text-xs text-gray-500">{principal?.user.email ?? ''}{s.owners.length > 1 ? ` (+${s.owners.length - 1})` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{s._count.products}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{s._count.views.toLocaleString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/marques/${s.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir la page publique">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                        <Link href={`/admin/marques/${s.id}`} className="p-2 hover:bg-france-blue/10 rounded-lg transition-colors" title="Éditer la fiche">
                          <Settings className="w-4 h-4 text-france-blue" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
