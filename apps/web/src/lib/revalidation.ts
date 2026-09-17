import { revalidatePath } from 'next/cache';

/**
 * Les fiches publiques sont mises en cache une heure (`revalidate = 3600`). Sans ceci,
 * une marque qui corrige sa description dans le Studio la voyait inchangée sur sa page
 * pendant une heure — et rien ne le lui disait. Toute écriture sur une marque ou un
 * produit appelle l'une de ces fonctions **après** la transaction.
 */
export function rafraichirMarque(slug: string, ancienSlug?: string | null): void {
  revalidatePath(`/marques/${slug}`);
  if (ancienSlug && ancienSlug !== slug) revalidatePath(`/marques/${ancienSlug}`);
  revalidatePath('/marques');
}

export function rafraichirProduit(slug: string, brandSlug?: string | null): void {
  revalidatePath(`/produits/${slug}`);
  revalidatePath('/produits');
  if (brandSlug) revalidatePath(`/marques/${brandSlug}`);
}
