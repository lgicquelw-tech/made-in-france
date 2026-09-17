/**
 * Signaux de personnalisation, **dans le navigateur** (REBUILD.md T8.9).
 *
 * Ce que l'utilisateur a cherché, quels secteurs et quelles marques il a regardés — gardé
 * dans `localStorage`, jamais envoyé pour être stocké. Le serveur reçoit ces préférences
 * dans la requête du fil, les utilise pour ordonner, et les oublie. Pas de profil, pas de
 * consentement à demander, et ça fonctionne dès la première visite.
 *
 * La partie pure (`resumer`, `ajouter…`) est testée ; l'accès au stockage est isolé et
 * tolère son absence (navigation privée, rendu serveur).
 */

export interface Signaux {
  /** Recherches récentes, la plus récente en premier. */
  recherches: { q: string; t: number }[];
  /** Secteurs consultés : slug → nombre de vues. */
  secteurs: Record<string, number>;
  /** Marques consultées : slug → horodatage de la dernière vue. */
  marques: Record<string, number>;
}

export interface Preferences {
  secteurs: string[];
  marques: string[];
  mots: string[];
}

const CLE = 'mif.signaux.v1';
const MAX_RECHERCHES = 10;
const MAX_MARQUES = 20;
const MAX_SECTEURS = 12;

export const vides = (): Signaux => ({ recherches: [], secteurs: {}, marques: {} });

/** Mots utiles d'une recherche : sans accent, minuscules, trois lettres et plus. */
export function motsDe(q: string): string[] {
  return q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((m) => m.length >= 3);
}

export function ajouterRecherche(s: Signaux, q: string, t = Date.now()): Signaux {
  const propre = q.trim();
  if (!propre) return s;
  const recherches = [{ q: propre, t }, ...s.recherches.filter((r) => r.q.toLowerCase() !== propre.toLowerCase())].slice(0, MAX_RECHERCHES);
  return { ...s, recherches };
}

export function ajouterVueSecteur(s: Signaux, slug: string): Signaux {
  if (!slug) return s;
  const secteurs = { ...s.secteurs, [slug]: (s.secteurs[slug] ?? 0) + 1 };
  const gardes = Object.entries(secteurs).sort((a, b) => b[1] - a[1]).slice(0, MAX_SECTEURS);
  return { ...s, secteurs: Object.fromEntries(gardes) };
}

export function ajouterVueMarque(s: Signaux, slug: string, t = Date.now()): Signaux {
  if (!slug) return s;
  const marques = { ...s.marques, [slug]: t };
  const gardees = Object.entries(marques).sort((a, b) => b[1] - a[1]).slice(0, MAX_MARQUES);
  return { ...s, marques: Object.fromEntries(gardees) };
}

/** Ce qui part au serveur : peu de choses, et rien d'identifiant. */
export function resumer(s: Signaux): Preferences {
  const secteurs = Object.entries(s.secteurs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const marques = Object.entries(s.marques).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  const mots = [...new Set(s.recherches.flatMap((r) => motsDe(r.q)))].slice(0, 6);
  return { secteurs, marques, mots };
}

export const aDesPreferences = (p: Preferences): boolean => p.secteurs.length + p.marques.length + p.mots.length > 0;

// ------------------------------------------------------------ stockage (navigateur)

export function lireSignaux(): Signaux {
  try {
    const brut = globalThis.localStorage?.getItem(CLE);
    if (!brut) return vides();
    const s = JSON.parse(brut) as Partial<Signaux>;
    return { recherches: s.recherches ?? [], secteurs: s.secteurs ?? {}, marques: s.marques ?? {} };
  } catch {
    return vides();
  }
}

export function ecrireSignaux(s: Signaux): void {
  try { globalThis.localStorage?.setItem(CLE, JSON.stringify(s)); } catch { /* stockage indisponible : on n'insiste pas */ }
}

export function oublierSignaux(): void {
  try { globalThis.localStorage?.removeItem(CLE); } catch { /* idem */ }
}

/** Raccourcis à appeler depuis les pages. */
export const noter = {
  recherche: (q: string) => ecrireSignaux(ajouterRecherche(lireSignaux(), q)),
  secteur: (slug: string | null | undefined) => { if (slug) ecrireSignaux(ajouterVueSecteur(lireSignaux(), slug)); },
  marque: (slug: string, secteurSlug?: string | null) => {
    let s = ajouterVueMarque(lireSignaux(), slug);
    if (secteurSlug) s = ajouterVueSecteur(s, secteurSlug);
    ecrireSignaux(s);
  },
};

/** Les préférences sous forme de query string pour `/api/v1/feed`. */
export function enQuery(p: Preferences): string {
  const u = new URLSearchParams();
  if (p.secteurs.length) u.set('s', p.secteurs.join(','));
  if (p.marques.length) u.set('m', p.marques.join(','));
  if (p.mots.length) u.set('q', p.mots.join(','));
  return u.toString();
}
