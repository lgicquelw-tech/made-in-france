'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Download, Trash2, Loader2 } from 'lucide-react';

/**
 * Les deux droits qu'on exerce sans écrire à personne (T7.5) : télécharger ses données,
 * supprimer son compte. La suppression demande de retaper son adresse : un clic ne
 * suffit pas pour un acte définitif, mais on ne demande rien de plus.
 */
export function DonneesPersonnelles({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const supprimer = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const r = await fetch('/api/v1/me', { method: 'DELETE' });
      if (!r.ok) {
        setErreur('La suppression a échoué. Réessayez, ou écrivez-nous.');
        return;
      }
      await signOut({ callbackUrl: '/?compte=supprime' });
    } catch {
      setErreur('La suppression a échoué. Réessayez, ou écrivez-nous.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section aria-labelledby="donnees-titre" className="glass-card rounded-3xl p-6 md:p-8">
      <h2 id="donnees-titre" className="font-semibold text-france-blue mb-1">Vos données</h2>
      <p className="text-sm text-gray-600 mb-6">
        Tout ce que ce compte contient, et le moyen d’en finir. Détail dans la{' '}
        <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="/api/v1/me/export"
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 hover:border-france-blue hover:text-france-blue transition"
        >
          <Download className="w-4 h-4" />
          Télécharger mes données (JSON)
        </a>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 hover:bg-red-50 transition"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte
        </button>
      </div>

      {ouvert && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-900 mb-3">
            Définitif : vos favoris et votre historique disparaissent avec le compte. Pour confirmer,
            tapez votre adresse <strong>{email}</strong>.
          </p>
          <label htmlFor="confirmation-suppression" className="sr-only">Votre adresse e-mail, pour confirmer</label>
          <input
            id="confirmation-suppression"
            type="email"
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={email}
            className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-white text-gray-900 mb-3"
          />
          <button
            type="button"
            disabled={confirmation.trim().toLowerCase() !== email.toLowerCase() || enCours}
            onClick={supprimer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium disabled:opacity-40 hover:bg-red-700 transition"
          >
            {enCours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer définitivement
          </button>
          {erreur && <p role="alert" className="mt-3 text-sm text-red-800">{erreur}</p>}
        </div>
      )}
    </section>
  );
}
