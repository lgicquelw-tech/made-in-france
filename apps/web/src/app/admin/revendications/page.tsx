'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, X, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * L'examen humain des revendications de marque (REBUILD.md T8.1).
 *
 * Depuis le 1er septembre 2026, une revendication crée une demande `PENDING` au lieu
 * d'accorder la propriété — mais **aucun écran ne permettait de l'examiner** : la file
 * s'allongeait sans issue autre que du SQL à la main. C'est ici que la propriété d'une
 * marque s'accorde, et nulle part ailleurs dans le produit.
 */

interface Demande {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  companyRole: string | null;
  proofType: string;
  proofDetails: string | null;
  brand: { id: string; name: string; slug: string; websiteUrl: string | null };
  domaineDemandeur: string | null;
  domaineMarque: string | null;
  marqueDejaGeree: boolean;
  compteExiste: boolean;
}

const ETATS = [
  { cle: 'PENDING', libelle: 'À examiner' },
  { cle: 'APPROVED', libelle: 'Accordées' },
  { cle: 'REJECTED', libelle: 'Refusées' },
] as const;

export default function RevendicationsPage() {
  const [etat, setEtat] = useState<(typeof ETATS)[number]['cle']>('PENDING');
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/admin/claims?status=${etat}`);
      if (!res.ok) {
        setErreur('Les demandes n’ont pas pu être chargées.');
        return;
      }
      setDemandes((await res.json()).data ?? []);
    } catch {
      setErreur('Les demandes n’ont pas pu être chargées.');
    } finally {
      setLoading(false);
    }
  }, [etat]);

  useEffect(() => { void charger(); }, [charger]);

  const decider = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setEnCours(id);
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: notes[id]?.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'La décision n’a pas pu être enregistrée.');
        return;
      }
      await charger();
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Revendications de marque</h1>
        <p className="text-gray-500 mt-1">
          Accorder la gestion d’une fiche est une décision humaine : rien dans le produit ne la donne automatiquement.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {ETATS.map((e) => (
          <button key={e.cle} onClick={() => setEtat(e.cle)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${etat === e.cle ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {e.libelle}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-france-blue" /></div>
      ) : erreur ? (
        <p role="alert" className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">{erreur}</p>
      ) : demandes.length === 0 ? (
        <p className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">Aucune demande dans cet état.</p>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => {
            const memeDomaine = d.domaineDemandeur !== null && d.domaineDemandeur === d.domaineMarque;
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <Link href={`/marques/${d.brand.slug}`} target="_blank" className="text-lg font-semibold text-gray-900 hover:text-france-blue">
                        {d.brand.name}
                      </Link>
                      {d.marqueDejaGeree && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">déjà gérée par un compte</span>
                      )}
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div><dt className="inline text-gray-500">Demandeur : </dt><dd className="inline text-gray-900">{d.firstName} {d.lastName}</dd></div>
                      <div><dt className="inline text-gray-500">E-mail : </dt><dd className="inline text-gray-900">{d.email}</dd></div>
                      {d.phone && <div><dt className="inline text-gray-500">Téléphone : </dt><dd className="inline text-gray-900">{d.phone}</dd></div>}
                      {d.companyRole && <div><dt className="inline text-gray-500">Entreprise déclarée : </dt><dd className="inline text-gray-900">{d.companyRole}</dd></div>}
                      {d.proofDetails && <div className="sm:col-span-2"><dt className="inline text-gray-500">Preuve : </dt><dd className="inline text-gray-900">{d.proofDetails}</dd></div>}
                      <div><dt className="inline text-gray-500">Déposée le : </dt><dd className="inline text-gray-900">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</dd></div>
                      {d.reviewedAt && <div><dt className="inline text-gray-500">Examinée le : </dt><dd className="inline text-gray-900">{new Date(d.reviewedAt).toLocaleDateString('fr-FR')}</dd></div>}
                    </dl>

                    {/* Le seul indice automatique — il n'autorise rien, il oriente. */}
                    <p className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${memeDomaine ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                      {memeDomaine ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      {memeDomaine
                        ? `L’adresse est au domaine du site de la marque (${d.domaineMarque}) — indice, pas preuve.`
                        : `Domaine de l’adresse : ${d.domaineDemandeur ?? '—'} · domaine du site : ${d.domaineMarque ?? '—'}`}
                    </p>

                    {!d.compteExiste && (
                      <p className="text-sm text-amber-800">Le compte à l’origine de cette demande n’existe plus : elle ne peut plus être accordée.</p>
                    )}
                    {d.reviewNotes && <p className="text-sm text-gray-600">Note : {d.reviewNotes}</p>}
                  </div>

                  {d.status === 'PENDING' && (
                    <div className="lg:w-80 space-y-3">
                      <label htmlFor={`notes-${d.id}`} className="block text-sm text-gray-500">Motif de la décision (facultatif)</label>
                      <textarea
                        id={`notes-${d.id}`}
                        rows={2}
                        value={notes[d.id] ?? ''}
                        onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-france-blue focus:border-transparent"
                        placeholder="Vérification faite par…"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => decider(d.id, 'APPROVED')}
                          disabled={enCours === d.id || !d.compteExiste}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-40"
                        >
                          {enCours === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Accorder
                        </button>
                        <button
                          onClick={() => decider(d.id, 'REJECTED')}
                          disabled={enCours === d.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 font-medium hover:bg-red-50 transition disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                          Refuser
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
