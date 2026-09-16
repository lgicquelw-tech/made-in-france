import { Prisma } from '@prisma/client';

import { prisma } from './db';
import type { SearchBrand, SearchProduct, SearchResults } from '@/app/recherche/search-content';

/**
 * Recherche unifiée marques + produits (REBUILD.md T4.5, testée en T6.2).
 *
 * La construction des requêtes est séparée de leur exécution pour une raison précise :
 * pouvoir vérifier, sans base de données, que la saisie de l'utilisateur finit **dans
 * les paramètres liés** et jamais dans le texte SQL. C'est le constat n°4 de l'audit —
 * une injection SQL par la recherche — dont la fermeture doit rester prouvée par un
 * test, pas par une relecture.
 */

export const LIMITE = 20;

/** Sans accents — forme échappée plutôt que caractères combinants invisibles. */
export function sansAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export interface RequetesRecherche {
  marques: Prisma.Sql;
  produits: Prisma.Sql;
}

/**
 * Les deux requêtes, prêtes à exécuter. Chaque `${...}` est un paramètre lié :
 * une apostrophe, un point-virgule ou un `DROP` dans la saisie ne peuvent rien casser.
 */
export function construireRequetes(query: string): RequetesRecherche {
  const like = `%${query}%`;
  const likePlain = `%${sansAccents(query)}%`;

  const marques = Prisma.sql`
    SELECT 'brand' AS type, b.id, b.name, b.slug,
           b.description_short AS "description", b.logo_url AS "logoUrl", b.city,
           s.name AS sector, s.slug AS "sectorSlug", s.color AS "sectorColor"
    FROM brands b
    LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE (
      b.name ILIKE ${like} OR b.name ILIKE ${likePlain}
      OR b.description_short ILIKE ${like}
      OR similarity(b.name, ${query}) > 0.3
    )
    ORDER BY similarity(b.name, ${query}) DESC, b.name ASC
    LIMIT ${LIMITE}
  `;

  const produits = Prisma.sql`
    SELECT 'product' AS type, p.id, p.name, p.slug,
           p.description_short AS "description", p.image_url AS "imageUrl",
           p.price_min AS "priceMin", p.price_max AS "priceMax",
           b.name AS "brandName", b.slug AS "brandSlug", s.color AS "sectorColor"
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE p.status = 'ACTIVE'
      AND (
        p.name ILIKE ${like} OR p.name ILIKE ${likePlain}
        OR similarity(p.name, ${query}) > 0.3
      )
    ORDER BY similarity(p.name, ${query}) DESC, p.name ASC
    LIMIT ${LIMITE}
  `;

  return { marques, produits };
}

export async function rechercher(query: string): Promise<SearchResults> {
  if (!query.trim()) return { brands: [], products: [] };
  const { marques, produits } = construireRequetes(query);
  const [brands, products] = await Promise.all([
    prisma.$queryRaw<SearchBrand[]>(marques),
    prisma.$queryRaw<SearchProduct[]>(produits),
  ]);
  return { brands, products };
}
