import type { Metadata } from 'next';
import { PageJuridique } from '@/components/juridique/page-juridique';
import { EDITEUR, ouARenseigner } from '@/content/editeur';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Confidentialité et données — Made in France',
  description: 'Quelles données Made in France traite, pourquoi, combien de temps, et comment exercer vos droits.',
  alternates: { canonical: `${siteUrl()}/confidentialite` },
  openGraph: { title: 'Confidentialité et données — Made in France', url: `${siteUrl()}/confidentialite` },
  robots: { index: false },
};

/**
 * Chaque ligne de cette page décrit un traitement qui existe dans le code, et rien d'autre.
 * Si un traitement apparaît (mesure d'audience T7.3, événements serveur T8.2), cette page
 * change dans le même commit.
 */
export default function ConfidentialitePage() {
  return (
    <PageJuridique titre="Confidentialité et données" resume="Ce que nous enregistrons, ce que nous n’enregistrons pas, et comment reprendre la main.">
      <h2>Sans compte : rien côté serveur</h2>
      <p>
        La consultation du site ne demande aucun compte. Deux cookies techniques sont posés
        (<code>next-auth.csrf-token</code>, <code>next-auth.callback-url</code>) : ils protègent le
        formulaire de connexion contre les requêtes forgées, ne contiennent <strong>aucun identifiant de
        suivi</strong> et sont exemptés de consentement. C’est tout. Le fil de produits de l’accueil s’adapte à vos recherches récentes et aux marques que vous consultez :
        ces signaux sont gardés <strong>dans votre navigateur uniquement</strong> (stockage local,
        clé <code>mif.signaux.v1</code>), transmis à chaque page comme critères de tri, et jamais
        enregistrés par nos serveurs. Le lien « réinitialiser » sous le fil les efface.
      </p>
      <p>
        Il n’y a, à ce jour, <strong>aucun outil de mesure d’audience</strong> ni traceur publicitaire.
        Si nous en ajoutons un, il ne se déclenchera qu’après votre consentement explicite, et cette page
        le dira.
      </p>

      <h2>Avec un compte</h2>
      <table>
        <thead><tr><th>Donnée</th><th>Pourquoi</th><th>Durée</th></tr></thead>
        <tbody>
          <tr><td>Adresse e-mail, nom, mot de passe (haché, jamais lisible)</td><td>Créer et sécuriser votre compte</td><td>Jusqu’à la suppression du compte</td></tr>
          <tr><td>Identifiant Google et photo de profil, si vous vous connectez avec Google</td><td>Vous reconnaître</td><td>Idem</td></tr>
          <tr><td>Marques mises en favori</td><td>Votre liste de favoris</td><td>Idem</td></tr>
          <tr><td>Marques consultées et date, lorsque vous êtes connecté</td><td>Votre historique de découverte</td><td>Idem</td></tr>
          <tr><td>Pour un compte professionnel : entreprise, téléphone, SIRET déclarés</td><td>Examiner votre demande de gestion d’une fiche</td><td>Idem</td></tr>
        </tbody>
      </table>
      <p>
        Le cookie de session (<code>next-auth.session-token</code>) est strictement nécessaire à la
        connexion et ne sert à rien d’autre.
      </p>

      <h2>Ce que le serveur voit sans le garder</h2>
      <p>
        L’adresse IP sert à limiter le nombre de requêtes (inscriptions, assistant) ; le compteur vit en
        mémoire quelques minutes et n’est écrit nulle part. Les messages échangés avec l’assistant sont
        transmis au fournisseur du modèle (Anthropic) pour produire la réponse et ne sont pas
        conservés par nous.
      </p>

      <h2>Tiers qui reçoivent votre adresse IP en affichant une page</h2>
      <ul>
        <li><strong>Boutiques des marques</strong> : les images de produits sont, pour partie, chargées
          directement depuis le site de la marque. Ce site voit alors votre adresse IP, comme si vous le
          visitiez.</li>
        <li><strong>Google</strong> : les logos de marques sont des favicons servies par Google.</li>
        <li><strong>Mapbox</strong> : la page Carte charge ses fonds de carte chez Mapbox.</li>
        <li><strong>Cloudinary</strong> : hébergement d’images.</li>
      </ul>

      <h2>Marques référencées</h2>
      <p>
        Les fiches de marques et de produits sont constituées à partir d’informations publiques,
        collectées sur les sites des marques et datées. Elles peuvent contenir le nom de personnes
        (fondateur, artisan) tel que la marque le publie. Toute personne ou marque concernée peut
        demander correction ou retrait : la demande est traitée sans condition.
      </p>

      <h2>Vos droits</h2>
      <p>
        Depuis votre <a href="/profil">profil</a>, vous pouvez <strong>télécharger toutes vos données</strong>
        (format JSON) et <strong>supprimer votre compte</strong> — immédiatement, sans nous écrire. Pour
        toute autre demande (accès, rectification, opposition, limitation, portabilité), ou si vous n’avez
        pas de compte : {ouARenseigner(EDITEUR.email)}. Vous pouvez aussi saisir la CNIL (cnil.fr).
      </p>

      <h2>Responsable du traitement</h2>
      <p>{ouARenseigner(EDITEUR.raisonSociale)}, {ouARenseigner(EDITEUR.adresse)}. Hébergement : {ouARenseigner(EDITEUR.hebergeur)}.</p>
    </PageJuridique>
  );
}
