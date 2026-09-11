/**
 * Définition des contrôles de qualité (REBUILD.md T5.1).
 *
 * Un contrôle répond à une seule question, par oui ou non, sur une seule fiche.
 * La sévérité dit ce qu'on en fait :
 *
 *   BLOQUANT    — la fiche ne doit pas être publiée. Elle ferait mauvaise impression
 *                 ou mènerait à une page vide.
 *   RECOMMANDE  — la fiche est publiable mais incomplète. C'est le stock de travail.
 *
 * Cette séparation est le cœur de la phase 5 : elle transforme « 903 marques » en
 * « N marques publiables, M à compléter », qui est la seule question utile.
 */

export type Severite = 'BLOQUANT' | 'RECOMMANDE';

export interface Controle<T> {
  cle: string;
  libelle: string;
  severite: Severite;
  /** true = la fiche satisfait le contrôle. */
  ok: (fiche: T) => boolean;
}

/** Une chaîne présente, non vide une fois les espaces retirés. */
const rempli = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/** Une description utilisable, pas un mot jeté là. */
const descriptionUtile = (v: unknown, minimum: number): boolean =>
  rempli(v) && v.trim().length >= minimum;

/**
 * Une URL http(s) dont l'hôte ressemble à un vrai nom de domaine.
 *
 * `new URL()` seul ne suffit pas : il accepte `https://🌿`, ce qui avait laissé
 * 899 logos cassés en base (REBUILD.md, « 899 logos étaient des émojis »).
 */
export function urlPlausible(v: unknown): boolean {
  if (!rempli(v)) return false;
  let u: URL;
  try {
    u = new URL(v.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
    u.hostname,
  );
}

/** Un tableau JSON non vide — les colonnes Json valent `[]` par défaut. */
export function tableauNonVide(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

/** Au moins un lien de réseau social exploitable dans la colonne `socialLinks`. */
export function aUnReseauSocial(v: unknown): boolean {
  if (v === null || typeof v !== 'object') return false;
  return Object.values(v as Record<string, unknown>).some(urlPlausible);
}

// ---------------------------------------------------------------- marques

export interface FicheMarque {
  descriptionShort: string | null;
  sectorId: string | null;
  regionId: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: unknown;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  descriptionLong: string | null;
  yearFounded: number | null;
  socialLinks: unknown;
}

export const CONTROLES_MARQUE: Controle<FicheMarque>[] = [
  {
    cle: 'description',
    libelle: 'Description courte (≥ 40 caractères)',
    severite: 'BLOQUANT',
    ok: (m) => descriptionUtile(m.descriptionShort, 40),
  },
  {
    cle: 'secteur',
    libelle: 'Rattachée à un secteur',
    severite: 'BLOQUANT',
    ok: (m) => m.sectorId !== null,
  },
  {
    cle: 'region',
    libelle: 'Rattachée à une région',
    severite: 'BLOQUANT',
    ok: (m) => m.regionId !== null,
  },
  {
    cle: 'contact',
    // Corrige le 11 septembre 2026. Ce controle exigeait d'abord un **site web**, ce qui
    // ecartait CHEZ GIOVANNI et MAY'SAPE : deux artisans sans site, mais avec Instagram,
    // une ville, une region, un secteur et une vraie description. Ce sont exactement les
    // fiches qu'un annuaire existe pour montrer. La question utile n'est pas « a-t-elle
    // un site ? » mais « peut-on la joindre ? ».
    libelle: 'Un point de contact (site ou réseau social)',
    severite: 'BLOQUANT',
    ok: (m) => urlPlausible(m.websiteUrl) || aUnReseauSocial(m.socialLinks),
  },
  {
    cle: 'site',
    libelle: 'URL de site valide',
    severite: 'RECOMMANDE',
    ok: (m) => urlPlausible(m.websiteUrl),
  },
  {
    cle: 'visuel',
    // « en propre » est important : le site n'est pas nu pour autant, il derive un
    // favicon depuis le domaine de la marque. Mais un favicon de 64 pixels servi par
    // un tiers n'est pas un visuel de marque, et ne peut pas illustrer une fiche.
    libelle: 'Un visuel en propre (logo ou couverture)',
    severite: 'RECOMMANDE',
    ok: (m) => urlPlausible(m.logoUrl) || urlPlausible(m.coverImageUrl),
  },
  {
    cle: 'couverture',
    libelle: 'Image de couverture',
    severite: 'RECOMMANDE',
    ok: (m) => urlPlausible(m.coverImageUrl),
  },
  {
    cle: 'galerie',
    libelle: 'Galerie non vide',
    severite: 'RECOMMANDE',
    ok: (m) => tableauNonVide(m.galleryUrls),
  },
  {
    cle: 'ville',
    libelle: 'Ville renseignée',
    severite: 'RECOMMANDE',
    ok: (m) => rempli(m.city),
  },
  {
    cle: 'carte',
    libelle: 'Géolocalisée (apparaît sur la carte)',
    severite: 'RECOMMANDE',
    ok: (m) => m.latitude !== null && m.longitude !== null,
  },
  {
    cle: 'histoire',
    libelle: 'Description longue (≥ 200 caractères)',
    severite: 'RECOMMANDE',
    ok: (m) => descriptionUtile(m.descriptionLong, 200),
  },
  {
    cle: 'annee',
    libelle: 'Année de création',
    severite: 'RECOMMANDE',
    ok: (m) => typeof m.yearFounded === 'number',
  },
];

// ---------------------------------------------------------------- produits

export interface FicheProduit {
  descriptionShort: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  externalBuyUrl: string | null;
  affiliateUrl: string | null;
  categoryId: string | null;
  galleryUrls: unknown;
  materials: unknown;
  madeInFranceLevel: string | null;
  /** Posé par `pnpm data:links` quand le lien d'achat ne répond plus (T5.2). */
  buyUrlDeadAt?: Date | null;
}

/**
 * Le lien d'achat effectif : l'affiliation prime, sinon le lien direct.
 * Un lien déclaré mort par `data:links` ne compte pas — un bouton vers un 404
 * est pire qu'un bouton absent.
 */
export function lienAchat(p: FicheProduit): string | null {
  if (p.buyUrlDeadAt) return null;
  if (urlPlausible(p.affiliateUrl)) return p.affiliateUrl!.trim();
  if (urlPlausible(p.externalBuyUrl)) return p.externalBuyUrl!.trim();
  return null;
}

export const CONTROLES_PRODUIT: Controle<FicheProduit>[] = [
  {
    cle: 'image',
    libelle: 'Une image',
    severite: 'BLOQUANT',
    ok: (p) => urlPlausible(p.imageUrl),
  },
  {
    cle: 'prix',
    libelle: 'Un prix strictement positif',
    severite: 'BLOQUANT',
    ok: (p) => typeof p.priceMin === 'number' && p.priceMin > 0,
  },
  {
    cle: 'achat',
    libelle: "Un lien d'achat valide",
    severite: 'BLOQUANT',
    ok: (p) => lienAchat(p) !== null,
  },
  {
    cle: 'description',
    libelle: 'Description courte (≥ 40 caractères)',
    severite: 'BLOQUANT',
    ok: (p) => descriptionUtile(p.descriptionShort, 40),
  },
  {
    cle: 'categorie',
    libelle: 'Rattaché à une catégorie',
    severite: 'RECOMMANDE',
    ok: (p) => p.categoryId !== null,
  },
  {
    cle: 'galerie',
    libelle: 'Galerie non vide',
    severite: 'RECOMMANDE',
    ok: (p) => tableauNonVide(p.galleryUrls),
  },
  {
    cle: 'matieres',
    libelle: 'Matières renseignées',
    severite: 'RECOMMANDE',
    ok: (p) => tableauNonVide(p.materials),
  },
  {
    cle: 'origine',
    libelle: 'Niveau de fabrication française',
    severite: 'RECOMMANDE',
    ok: (p) => p.madeInFranceLevel !== null,
  },
];
