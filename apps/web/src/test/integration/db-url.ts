/**
 * L'adresse de la base de test, dérivée de `DATABASE_URL` : même serveur, même rôle,
 * base `madeinfrance_test`. `DATABASE_URL_TEST` la remplace si elle est définie
 * (utile en intégration continue, où la base porte le nom qu'on veut).
 *
 * Garde-fou : si l'adresse calculée est **identique** à la base de développement, on
 * refuse de démarrer. Les tests vident les tables ; sur la mauvaise base, ce serait
 * la perte des 903 marques.
 */
export function urlBaseDeTest(): string {
  const explicite = process.env.DATABASE_URL_TEST;
  const dev = process.env.DATABASE_URL;
  if (explicite) {
    if (explicite === dev) throw new Error('DATABASE_URL_TEST est identique à DATABASE_URL : refus.');
    return explicite;
  }
  if (!dev) throw new Error('DATABASE_URL absente : impossible de dériver la base de test.');
  const u = new URL(dev);
  if (u.pathname.endsWith('_test')) return dev;
  u.pathname = `${u.pathname}_test`;
  return u.toString();
}
