import Link from 'next/link';

/**
 * Sous chaque fiche collectée : d'où viennent ces informations, quand, et quoi faire si
 * l'on est la marque (T7.5). Le site republie ce que les boutiques publient ; il doit le
 * dire à l'endroit même où il le fait, pas seulement dans une page juridique.
 */
export function OrigineDonnees({
  source, collecteLe, marque,
}: {
  /** URL de la fiche d'origine (lien d'achat), pour en tirer le domaine. */
  source: string | null;
  collecteLe: Date | string | null | undefined;
  marque: string;
}) {
  let domaine: string | null = null;
  try {
    domaine = source ? new URL(source).hostname.replace(/^www\./, '') : null;
  } catch {
    domaine = null;
  }
  const date = collecteLe ? new Date(collecteLe) : null;

  return (
    <p className="text-xs text-gray-500 leading-relaxed">
      {domaine ? (
        <>Informations, prix et images relevés sur <span className="font-medium text-gray-600">{domaine}</span></>
      ) : (
        <>Informations fournies par {marque}</>
      )}
      {date && !Number.isNaN(date.getTime()) && (
        <> le {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
      )}
      . Le prix et la disponibilité font foi sur le site du vendeur.{' '}
      Vous représentez {marque} ?{' '}
      <Link href="/studio/revendiquer" className="underline hover:text-france-blue">Gérez cette fiche</Link>
      {' '}ou <Link href="/contact" className="underline hover:text-france-blue">demandez son retrait</Link>.
    </p>
  );
}

/** Même chose pour une fiche marque : constituée à partir de ce que la marque publie. */
export function OrigineMarque({ marque, siteWeb }: { marque: string; siteWeb: string | null }) {
  let domaine: string | null = null;
  try {
    domaine = siteWeb ? new URL(siteWeb).hostname.replace(/^www\./, '') : null;
  } catch {
    domaine = null;
  }
  return (
    <p className="text-xs text-gray-500 leading-relaxed">
      Fiche constituée à partir d’informations publiques{domaine ? <> — notamment <span className="font-medium text-gray-600">{domaine}</span></> : null}.
      Les noms, logos et images appartiennent à {marque}.{' '}
      Vous la représentez ?{' '}
      <Link href="/studio/revendiquer" className="underline hover:text-france-blue">Gérez cette fiche</Link>
      {' '}ou <Link href="/contact" className="underline hover:text-france-blue">demandez son retrait</Link>.
    </p>
  );
}
