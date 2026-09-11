/**
 * Nettoyage d'une URL de site de marque (REBUILD.md T5.4).
 *
 * Module pur. Retire les paramètres de suivi (`utm_*`, `fbclid`, `gclid`…) qu'une
 * marque colle à son lien quand elle le copie depuis Instagram ou une campagne. Ils
 * n'identifient pas la page ; ils identifient la campagne — et ils font suivre chaque
 * visiteur de l'annuaire comme s'il venait de cette campagne.
 *
 * Tout autre paramètre est conservé : on ne sait pas s'il sert à la page.
 */

const PARAMETRES_DE_SUIVI = new Set([
  'fbclid', 'gclid', 'dclid', 'msclkid', 'twclid', 'igshid', 'mc_cid', 'mc_eid', '_ga', '_gl', 'yclid',
]);

const estDeSuivi = (nom: string): boolean =>
  PARAMETRES_DE_SUIVI.has(nom.toLowerCase()) || nom.toLowerCase().startsWith('utm_');

/**
 * @returns l'URL sans ses paramètres de suivi, ou telle quelle si elle n'est pas
 *          analysable — le nettoyage ne doit jamais casser une URL qu'il ne comprend pas.
 */
export function retirerParametresDeSuivi(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  const aRetirer = [...u.searchParams.keys()].filter(estDeSuivi);
  if (aRetirer.length === 0) return url;
  for (const nom of aRetirer) u.searchParams.delete(nom);
  return u.toString();
}
