import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';
import { productSearchQuerySchema } from '@/lib/validation/product';

/**
 * Recherche de produits pour l'administration. Migré depuis Express.
 *
 * La requête reste du SQL brut : elle calcule un score de pertinence que
 * l'API Prisma n'exprime pas, et elle s'appuie sur `similarity()` de `pg_trgm`
 * — donc sur l'index GIN trigram posé en phase 2 (T2.9).
 *
 * ⚠️ Elle utilise `$queryRaw` **balisé**, où chaque `${...}` devient un
 * paramètre lié. Ce n'est pas `$queryRawUnsafe` : il n'y a aucune
 * concaténation, et une apostrophe dans la recherche ne casse rien.
 */

type SearchRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  is_featured: boolean;
  status: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  sector_color: string | null;
  relevance: number;
};

export const GET = route(async (request: Request) => {
  await requireAdmin();

  const url = new URL(request.url);
  const { q, limit } = productSearchQuerySchema.parse(Object.fromEntries(url.searchParams));

  if (!q) return NextResponse.json({ data: [] });

  // Recherche sans accents : « creme » doit trouver « crème ».
  const plain = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT
      p.id, p.name, p.slug, p.image_url, p.price_min, p.price_max,
      p.is_featured, p.status,
      b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug,
      s.color AS sector_color,
      CASE
        WHEN p.name ILIKE ${q} OR p.name ILIKE ${plain} THEN 100
        WHEN p.name ILIKE ${q + '%'} OR p.name ILIKE ${plain + '%'} THEN 90
        WHEN p.name ILIKE ${'%' + q + '%'} OR p.name ILIKE ${'%' + plain + '%'} THEN 80
        WHEN b.name ILIKE ${q} OR b.name ILIKE ${plain} THEN 70
        WHEN b.name ILIKE ${'%' + q + '%'} OR b.name ILIKE ${'%' + plain + '%'} THEN 60
        WHEN similarity(p.name, ${q}) > 0.4 THEN similarity(p.name, ${q}) * 50
        WHEN similarity(p.name, ${plain}) > 0.4 THEN similarity(p.name, ${plain}) * 50
        WHEN similarity(b.name, ${q}) > 0.4 THEN similarity(b.name, ${q}) * 40
        WHEN similarity(b.name, ${plain}) > 0.4 THEN similarity(b.name, ${plain}) * 40
        ELSE 0
      END AS relevance
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE p.status = 'ACTIVE'
      AND (
        p.name ILIKE ${'%' + q + '%'} OR p.name ILIKE ${'%' + plain + '%'}
        OR b.name ILIKE ${'%' + q + '%'} OR b.name ILIKE ${'%' + plain + '%'}
        OR similarity(p.name, ${q}) > 0.4 OR similarity(p.name, ${plain}) > 0.4
        OR similarity(b.name, ${q}) > 0.4 OR similarity(b.name, ${plain}) > 0.4
      )
    ORDER BY relevance DESC, p.is_featured DESC, p.name ASC
    LIMIT ${limit}
  `;

  return NextResponse.json({
    data: rows
      .filter((row) => row.relevance > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.image_url,
        priceMin: row.price_min,
        priceMax: row.price_max,
        isFeatured: row.is_featured,
        status: row.status,
        brand: {
          id: row.brand_id,
          name: row.brand_name,
          slug: row.brand_slug,
          sector: { color: row.sector_color },
        },
      })),
  });
});
