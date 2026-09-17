import { revalidatePath } from 'next/cache';

/**
 * Les fiches publiques sont mises en cache une heure (`revalidate = 3600`). Sans ceci,
 * une marque qui corrige sa description dans le Studio la voyait inchangée sur sa page
 * pendant une heure — et rien ne le lui disait. Toute écriture sur une marque ou un
 * produit appelle l'une de ces fonctions **après** la transaction.
 *
 * Le rafraîchissement ne peut pas faire échouer l'écriture qu'il suit : l'écriture est
 * déjà en base. Hors d'une requête Next (tests d'intégration qui appellent la route
 * directement), `revalidatePath` lève « static generation store missing » ; on le dit
 * et on continue.
 */
function rafraichir(chemin: string): void {
  try {
    revalidatePath(chemin);
  } catch (e) {
    console.warn(`[cache] rafraîchissement impossible de ${chemin} : ${e instanceof Error ? e.message : e}`);
  }
}

export function rafraichirMarque(slug: string, ancienSlug?: string | null): void {
  rafraichir(`/marques/${slug}`);
  if (ancienSlug && ancienSlug !== slug) rafraichir(`/marques/${ancienSlug}`);
  rafraichir('/marques');
}

export function rafraichirProduit(slug: string, brandSlug?: string | null): void {
  rafraichir(`/produits/${slug}`);
  rafraichir('/produits');
  if (brandSlug) rafraichir(`/marques/${brandSlug}`);
}
