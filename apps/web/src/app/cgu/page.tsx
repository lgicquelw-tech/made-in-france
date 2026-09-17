import type { Metadata } from 'next';
import { PageJuridique } from '@/components/juridique/page-juridique';
import { EDITEUR, ouARenseigner } from '@/content/editeur';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Made in France",
  description: "Ce que vous pouvez faire sur Made in France, ce que nous nous engageons à faire, et ce que le site n'est pas.",
  alternates: { canonical: `${siteUrl()}/cgu` },
  openGraph: { title: "Conditions d'utilisation — Made in France", url: `${siteUrl()}/cgu` },
  robots: { index: false },
};

export default function CguPage() {
  return (
    <PageJuridique titre="Conditions d’utilisation" resume="Un annuaire, pas une boutique : ce que le site fait, et ce qu’il ne fait pas.">
      <h2>Objet</h2>
      <p>
        {EDITEUR.nomDuSite} est un service de découverte de marques et de produits fabriqués en France.
        Il présente des fiches et renvoie vers les sites des marques. <strong>Il ne vend rien</strong> : tout
        achat se fait sur le site du vendeur, selon ses propres conditions.
      </p>

      <h2>Accès au service</h2>
      <p>
        La consultation est libre et sans compte. Un compte, facultatif, permet d’enregistrer des favoris.
        Un compte professionnel permet à une marque de demander la gestion de sa fiche : cette demande
        est examinée par une personne avant toute attribution — voir la <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Exactitude des informations</h2>
      <p>
        Les fiches produits sont collectées automatiquement et datées. Nous nous efforçons de les tenir à
        jour, mais un prix, une disponibilité ou une description peuvent différer de ceux du vendeur au
        moment de votre visite. <strong>Seul le site du vendeur fait foi.</strong> Signalez-nous toute erreur.
      </p>

      <h2>Comptes et comportements</h2>
      <p>
        Vous êtes responsable de la confidentialité de votre mot de passe. Il est interdit de revendiquer
        une marque que vous ne représentez pas, d’extraire massivement les données du site ou d’en
        perturber le fonctionnement. Un compte peut être suspendu en cas de manquement.
      </p>

      <h2>Suppression de compte</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis votre <a href="/profil">profil</a>. La
        suppression est immédiate et définitive ; elle emporte vos favoris et votre historique.
      </p>

      <h2>Responsabilité</h2>
      <p>
        {EDITEUR.nomDuSite} n’est pas partie aux transactions conclues avec les vendeurs et ne garantit
        ni leurs produits ni leurs services. Le service est fourni « en l’état » et peut évoluer ou
        s’interrompre.
      </p>

      <h2>Droit applicable</h2>
      <p>Ces conditions sont soumises au droit français. Contact : {ouARenseigner(EDITEUR.email)}.</p>
    </PageJuridique>
  );
}
