import { unstable_cache } from 'next/cache';

import { prisma } from './db';
import { OU_MARQUE_PUBLIQUE } from './marque-publique';
import type { Chiffres } from './chiffres-format';

export type { Chiffres } from './chiffres-format';

/**
 * Les trois chiffres du pied de page, lus en base et mis en cache une heure.
 *
 * Ils étaient écrits en dur — « 900+ », « 5000+ », « 18 » — sur toutes les pages, pendant
 * que la base disait 899, 35 137 et 13. Un pied de page qui ment sur chaque page n'est pas
 * un détail : c'est la première chose qu'un visiteur attentif vérifie. Et la règle du
 * projet est sans exception : jamais un chiffre inventé, un écran vide vaut mieux.
 *
 * `null` quand la base ne répond pas : le pied de page n'affiche alors pas de compteurs.
 */

/** Le calcul nu, sans cache — c'est lui que les tests appellent. */
export async function compter(): Promise<Chiffres | null> {
  try {
    const [marques, produits, regions] = await Promise.all([
      prisma.brand.count({ where: OU_MARQUE_PUBLIQUE }),
      prisma.product.count({ where: { status: 'ACTIVE', brand: OU_MARQUE_PUBLIQUE } }),
      prisma.region.count({ where: { brands: { some: OU_MARQUE_PUBLIQUE } } }),
    ]);
    return { marques, produits, regions };
  } catch {
    return null;
  }
}

export const lireChiffres = unstable_cache(compter, ['chiffres-pied-de-page'], { revalidate: 3600 });
