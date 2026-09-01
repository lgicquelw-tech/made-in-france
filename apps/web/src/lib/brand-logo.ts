/**
 * Adresse du logo d'une marque, avec repli.
 *
 * ⚠️ Cette logique était **recopiée dans 16 fichiers**, avec des tailles et
 * des replis différents — et absente de deux pages, qui affichaient donc une
 * simple lettre là où les autres montraient un vrai logo.
 *
 * Contexte : aucune marque n'a de logo fourni. La colonne `logo_url` du
 * fichier source était vide, et l'import y rangeait par erreur l'émoji de la
 * colonne voisine (voir REBUILD.md). Le logo est donc dérivé du site de la
 * marque via le service de favicons de Google.
 *
 * ⚠️ Cela envoie le domaine de chaque marque affichée à Google. C'est un
 * transfert de données à un tiers, à mentionner dans la politique de
 * confidentialité (T7.5), ou à remplacer par une récupération côté serveur.
 */
export function brandLogoUrl(
  brand: { logoUrl?: string | null; websiteUrl?: string | null },
  size: 64 | 128 = 64
): string | null {
  if (brand.logoUrl) return brand.logoUrl;
  if (!brand.websiteUrl) return null;

  try {
    const { hostname } = new URL(brand.websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    // Une URL de site invalide ne doit pas faire tomber la page.
    return null;
  }
}
