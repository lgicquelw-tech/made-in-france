import type { Metadata } from 'next';
import { PageJuridique } from '@/components/juridique/page-juridique';
import { EDITEUR, ouARenseigner } from '@/content/editeur';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mentions légales — Made in France',
  description: "Identité de l'éditeur et de l'hébergeur du site Made in France, propriété intellectuelle, origine des données.",
  alternates: { canonical: `${siteUrl()}/mentions-legales` },
  openGraph: { title: 'Mentions légales — Made in France', url: `${siteUrl()}/mentions-legales` },
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <PageJuridique titre="Mentions légales" resume="Qui édite ce site, qui l’héberge, et d’où viennent les informations qu’il publie.">
      <h2>Éditeur</h2>
      <p>
        Le site {EDITEUR.nomDuSite} est édité par <strong>{ouARenseigner(EDITEUR.raisonSociale)}</strong>
        {EDITEUR.formeJuridique ? `, ${EDITEUR.formeJuridique}` : ''}
        {EDITEUR.immatriculation ? ` — ${EDITEUR.immatriculation}` : ''}.
      </p>
      <p>Siège : {ouARenseigner(EDITEUR.adresse)}.<br />Contact : {ouARenseigner(EDITEUR.email)}.</p>
      <p>Direction de la publication : {ouARenseigner(EDITEUR.directionPublication)}.</p>

      <h2>Hébergement</h2>
      <p>{ouARenseigner(EDITEUR.hebergeur)}</p>

      <h2>Origine des informations publiées</h2>
      <p>
        Les fiches de marques sont constituées à partir d’informations publiques : sites officiels des
        marques, réseaux sociaux, registres. Les fiches de produits — noms, descriptions, prix, images,
        lien d’achat — sont <strong>collectées automatiquement sur la boutique en ligne de chaque marque</strong> et
        mentionnent la date de cette collecte. Elles renvoient toujours vers la source ; les prix et
        disponibilités font foi sur le site du vendeur, jamais ici.
      </p>
      <p>
        Les noms, logos et images restent la propriété de leurs titulaires. Ils sont reproduits dans le
        seul but de présenter les marques et de renvoyer vers elles. Une marque qui souhaite corriger,
        compléter ou retirer sa fiche peut{' '}
        <a href="/studio/revendiquer">revendiquer sa page</a> ou écrire à {ouARenseigner(EDITEUR.email)} ;
        la demande de retrait est traitée sans condition.
      </p>

      <h2>Liens d’achat</h2>
      <p>
        Les liens « Acheter » conduisent vers le site du vendeur. {EDITEUR.nomDuSite} ne vend rien, ne
        traite aucune commande et ne perçoit, à ce jour, aucune commission sur ces liens. Si un
        programme d’affiliation était mis en place, il serait indiqué sur cette page et sur les fiches
        concernées.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure du site, ses textes propres et sa présentation sont protégés. Les données de
        marques et de produits qui y sont reproduites appartiennent à leurs titulaires respectifs.
      </p>
    </PageJuridique>
  );
}
