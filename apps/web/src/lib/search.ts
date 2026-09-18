import { Prisma } from '@prisma/client';
import { SQL_MARQUE_PUBLIQUE } from './marque-publique';

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
export function construireRequetes(query: string, limite: number = LIMITE): RequetesRecherche {
  // Les deux côtés désaccentués par `unaccent()` — voir `catalogue-public.ts`.
  const plain = sansAccents(query);
  const like = `%${plain}%`;

  const marques = Prisma.sql`
    SELECT 'brand' AS type, b.id, b.name, b.slug,
           b.description_short AS "description", b.logo_url AS "logoUrl",
           b.website_url AS "websiteUrl", b.city,
           s.name AS sector, s.slug AS "sectorSlug", s.color AS "sectorColor"
    FROM brands b
    LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE ${SQL_MARQUE_PUBLIQUE} AND (
      unaccent(b.name) ILIKE ${like}
      OR unaccent(b.description_short) ILIKE ${like}
      OR similarity(unaccent(b.name), ${plain}) > 0.3
    )
    ORDER BY (unaccent(b.name) ILIKE ${like}) DESC, similarity(unaccent(b.name), ${plain}) DESC, b.name ASC
    LIMIT ${limite}
  `;

  const produits = Prisma.sql`
    SELECT 'product' AS type, p.id, p.name, p.slug,
           p.description_short AS "description", p.image_url AS "imageUrl",
           p.price_min AS "priceMin", p.price_max AS "priceMax",
           b.name AS "brandName", b.slug AS "brandSlug", s.color AS "sectorColor"
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE p.status = 'ACTIVE' AND ${SQL_MARQUE_PUBLIQUE}
      AND (
        unaccent(p.name) ILIKE ${like}
        OR similarity(unaccent(p.name), ${plain}) > 0.3
      )
    ORDER BY similarity(unaccent(p.name), ${plain}) DESC, p.name ASC
    LIMIT ${limite}
  `;

  return { marques, produits };
}

export async function rechercher(query: string, limite: number = LIMITE): Promise<SearchResults> {
  if (!query.trim()) return { brands: [], products: [] };
  const { marques, produits } = construireRequetes(query, limite);
  const [brands, products] = await Promise.all([
    prisma.$queryRaw<SearchBrand[]>(marques),
    prisma.$queryRaw<SearchProduct[]>(produits),
  ]);
  return { brands, products };
}
