import type { Metadata } from 'next';
import { PageJuridique } from '@/components/juridique/page-juridique';
import { EDITEUR, ouARenseigner } from '@/content/editeur';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact — Made in France',
  description: 'Écrire à Made in France : corriger une fiche, revendiquer une marque, exercer vos droits.',
  alternates: { canonical: `${siteUrl()}/contact` },
  openGraph: { title: 'Contact — Made in France', url: `${siteUrl()}/contact` },
};

/** Pas de formulaire : le site n'envoie pas d'e-mail (Resend n'est pas branché). Une adresse suffit. */
export default function ContactPage() {
  return (
    <PageJuridique titre="Contact" resume="Une fiche à corriger, une marque à revendiquer, une donnée à retirer : une seule adresse.">
      <h2>Vous représentez une marque</h2>
      <p>
        Le plus direct : <a href="/studio/revendiquer">revendiquer votre fiche</a>. Après examen, vous
        pourrez la modifier vous-même. Pour un retrait pur et simple, écrivez-nous : il est fait sans
        condition.
      </p>
      <h2>Vous avez repéré une erreur</h2>
      <p>Prix, lien mort, image trompeuse, marque qui ne fabrique pas en France : dites-le nous, avec le lien de la fiche.</p>
      <h2>Vos données</h2>
      <p>
        Téléchargement et suppression se font depuis votre <a href="/profil">profil</a>. Pour le reste,
        voir la <a href="/confidentialite">politique de confidentialité</a>.
      </p>
      <h2>Adresse</h2>
      <p>
        {EDITEUR.email ? <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a> : ouARenseigner(EDITEUR.email)}
      </p>
    </PageJuridique>
  );
}
