import Link from 'next/link';
import type { ReactNode } from 'react';
import { EDITEUR, mentionsIncompletes } from '@/content/editeur';

/**
 * Gabarit commun des pages juridiques : titre, date de révision, sommaire des autres
 * textes, et — tant que l'identité de l'éditeur n'est pas complète — un bandeau qui
 * le dit. Un texte juridique à trous qui ne le signale pas est pire qu'absent.
 */
const TEXTES = [
  { href: '/mentions-legales', nom: 'Mentions légales' },
  { href: '/confidentialite', nom: 'Confidentialité et données' },
  { href: '/cgu', nom: "Conditions d'utilisation" },
  { href: '/contact', nom: 'Contact' },
];

export function PageJuridique({ titre, resume, children }: { titre: string; resume: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-france-blue to-blue-700 text-white">
        <div className="container py-14">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{titre}</h1>
            <p className="text-lg text-blue-100">{resume}</p>
            <p className="text-sm text-blue-200 mt-4">Dernière révision : {EDITEUR.dateRevision}</p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {mentionsIncompletes() && (
            <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">
              <strong>Version de travail.</strong> L’identité complète de l’éditeur et de l’hébergeur
              n’est pas encore renseignée : les champs concernés sont marqués « à renseigner ».
              Ce site n’est pas encore ouvert au public.
            </div>
          )}

          <nav aria-label="Textes juridiques" className="flex flex-wrap gap-2 text-sm">
            {TEXTES.map((t) => (
              <Link key={t.href} href={t.href} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-france-blue hover:text-france-blue transition">
                {t.nom}
              </Link>
            ))}
          </nav>

          <article className="prose prose-gray max-w-none bg-white rounded-2xl border border-gray-200 p-8 md:p-10">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
