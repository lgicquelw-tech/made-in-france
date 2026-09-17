import { getSession, signIn } from 'next-auth/react';

/**
 * Connexion par mot de passe, avec la seule vérification qui vaut : **la session existe-t-elle ?**
 *
 * `signIn('credentials', { redirect: false })` ne renvoie pas d'`error` quand NextAuth
 * rejette la requête pour jeton anti-CSRF invalide — il renvoie une `url` vers sa propre
 * page de connexion. Les quatre écrans qui appelaient `signIn` ne regardaient que `error` :
 * un rejet passait donc pour une réussite, et l'écran redirigeait vers le Studio **sans
 * session**. La personne se retrouvait déconnectée sur une page qui la croyait connectée.
 * Observé le 18 septembre 2026 en traçant `/api/auth/callback/credentials` (`signin?csrf=true`).
 *
 * @returns `null` si la session est bien ouverte, sinon un message affichable.
 */
export async function connecter(email: string, motDePasse: string): Promise<string | null> {
  for (let essai = 0; essai < 2; essai += 1) {
    const resultat = await signIn('credentials', { email, password: motDePasse, redirect: false });

    if (resultat?.error) return 'Email ou mot de passe incorrect';

    // Le rejet anti-CSRF ne dit pas son nom : il renvoie vers la page de connexion de
    // NextAuth. Il se produit quand on valide le formulaire dans la seconde qui suit
    // l'ouverture de la page — le jeton part avant que le cookie qui l'accompagne ne soit
    // écrit. Un gestionnaire de mots de passe le déclenche. On réessaie **une** fois : au
    // second appel le cookie est là. Au-delà, c'est un vrai échec, et on le dit.
    if (resultat?.url?.includes('/api/auth/signin')) continue;

    const session = await getSession();
    if (session?.user) return null;
  }

  return 'La connexion a échoué. Réessayez.';
}
