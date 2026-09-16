/**
 * Normalisation des valeurs lues dans `data/brands.xlsx` (REBUILD.md T6.2).
 *
 * Ces fonctions vivaient dans `import-brands.ts`, un fichier de 700 lignes qui lance
 * `main()` à l'import : impossible à tester sans déclencher un import réel. Les voici
 * seules, pures, testées dans `normalisation.test.ts`.
 *
 * Chacune porte la trace d'un défaut réel :
 *   - `cleanUrl` a laissé passer 899 émojis préfixés par `https://` ;
 *   - `lireNom` a perdu trois marques réelles (909, 1083, 1336) parce que XLSX lit
 *     leur nom comme un nombre.
 */

import { retirerParametresDeSuivi } from '../brands/urls';

/**
 * Lit le nom d'une marque tel que XLSX le fournit.
 *
 * Certaines marques ont un nom purement numérique (909, 1083, 1336). XLSX les lit
 * comme des **nombres** : toute validation en `typeof === 'string'` les rejetait, et
 * trois marques réelles disparaissaient en silence à chaque import.
 */
export function lireNom(valeur: unknown): string {
  return valeur == null ? '' : String(valeur);
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function cleanUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  
  url = url.trim();
  if (!url) return null;
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // ⚠️ `new URL()` ne suffit pas : les URL autorisent l'unicode dans le nom
  // d'hote, donc `https://🌬️` est parfaitement valide a ses yeux. Combine au
  // prefixage automatique ci-dessus, cela transformait la colonne « Image
  // (Logo) » du fichier Excel — qui contient des EMOJIS — en 899 adresses de
  // logo cassees. On exige donc un nom de domaine plausible.
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const looksLikeDomain = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(host);
    // Les parametres de suivi (utm_*, fbclid...) identifient une campagne, pas une
    // page : on ne les garde pas (REBUILD.md T5.4).
    return looksLikeDomain ? retirerParametresDeSuivi(url) : null;
  } catch {
    return null;
  }
}

export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
