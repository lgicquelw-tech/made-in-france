import { Prisma } from '@prisma/client';
import { SQL_MARQUE_PUBLIQUE } from './marque-publique';
import { z } from 'zod';

import { prisma } from './db';
import { sansAccents } from './search';

/**
 * Listes publiques de marques et de produits, avec recherche et filtres combinés
 * (REBUILD.md T3.4). Portées depuis Express, où deux défauts coexistaient :
 *
 *   - chercher dans l'annuaire basculait sur une route qui **ignorait** les filtres
 *     région et secteur — filtrer sur « Bretagne » puis taper un mot perdait la Bretagne ;
 *   - le filtre de secteur des produits était **concaténé** dans le SQL (constat n°4).
 *
 * Ici, une seule requête par liste, où recherche et filtres s'additionnent, et où chaque
 * valeur venue du client est un paramètre lié. La construction est séparée de
 * l'exécution pour être testée sans base (comme `search.ts`).
 */

const page = z.coerce.number().int().min(1).default(1);
const limit = (defaut: number) => z.coerce.number().int().min(1).max(100).default(defaut);
const slug = z.string().trim().regex(/^[a-z0-9-]*$/, 'slug invalide').max(100).optional().transform((v) => v || undefined);
const texte = z.string().trim().max(200).optional().transform((v) => v || undefined);

export const parametresMarques = z.object({
  q: texte,
  region: slug,
  sector: slug,
  page,
  limit: limit(20),
});
export type ParametresMarques = z.infer<typeof parametresMarques>;

/** Le tri vient d'une liste blanche : un ORDER BY ne peut pas être un paramètre lié. */
export const TRIS_PRODUITS = ['newest', 'price-asc', 'price-desc', 'name-asc'] as const;

export const parametresProduits = z.object({
  q: texte,
  sector: slug,
  sort: z.enum(TRIS_PRODUITS).default('newest'),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  page,
  limit: limit(24),
});
export type ParametresProduits = z.infer<typeof parametresProduits>;

export interface Pagination { page: number; limit: number; total: number; totalPages: number }

const pagination = (p: number, l: number, total: number): Pagination => ({
  page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)),
});

/**
 * Clause de correspondance texte, partagée. Les **deux** côtés sont désaccentués par
 * `unaccent()` : 191 noms de marque sur 903 portent un accent, et désaccentuer la seule
 * saisie laissait « creme » sans réponse devant « CRÈME BRÛLÉE ». Découvert par un test
 * d'intégration, le 16 septembre 2026.
 */
function correspondance(colonne: Prisma.Sql, q: string): Prisma.Sql {
  const like = `%${sansAccents(q)}%`;
  return Prisma.sql`(unaccent(${colonne}) ILIKE ${like} OR similarity(unaccent(${colonne}), ${sansAccents(q)}) > 0.3)`;
}

// ------------------------------------------------------------------ marques

export function construireListeMarques(p: ParametresMarques): { liste: Prisma.Sql; compte: Prisma.Sql } {
  const filtres: Prisma.Sql[] = [SQL_MARQUE_PUBLIQUE];
  if (p.region) filtres.push(Prisma.sql`r.slug = ${p.region}`);
  if (p.sector) filtres.push(Prisma.sql`s.slug = ${p.sector}`);
  if (p.q) {
    const like = `%${sansAccents(p.q)}%`;
    filtres.push(Prisma.sql`(${correspondance(Prisma.sql`b.name`, p.q)} OR unaccent(b.city) ILIKE ${like} OR unaccent(b.description_short) ILIKE ${like})`);
  }
  const where = filtres.length ? Prisma.sql`WHERE ${Prisma.join(filtres, ' AND ')}` : Prisma.empty;
  // Une correspondance dans le nom passe avant une correspondance dans la description
  // ou la ville : « creme » doit d'abord montrer les marques qui s'appellent ainsi.
  const ordre = p.q
    ? Prisma.sql`(unaccent(b.name) ILIKE ${`%${sansAccents(p.q)}%`}) DESC, similarity(unaccent(b.name), ${sansAccents(p.q)}) DESC, b.name ASC`
    : Prisma.sql`b.name ASC`;
  const depuis = Prisma.sql`FROM brands b LEFT JOIN regions r ON b.region_id = r.id LEFT JOIN sectors s ON b.sector_id = s.id ${where}`;

  return {
    liste: Prisma.sql`
      SELECT b.id, b.name, b.slug, b.description_short AS "description", b.logo_url AS "logoUrl",
             b.website_url AS "websiteUrl", b.city,
             r.name AS region, s.name AS sector, s.slug AS "sectorSlug", s.color AS "sectorColor"
      ${depuis}
      ORDER BY ${ordre}
      LIMIT ${p.limit} OFFSET ${(p.page - 1) * p.limit}`,
    compte: Prisma.sql`SELECT count(*)::int AS n ${depuis}`,
  };
}

export interface MarqueListee {
  id: string; name: string; slug: string; description: string | null; logoUrl: string | null;
  websiteUrl: string | null; city: string | null; region: string | null; sector: string | null;
  sectorSlug: string | null; sectorColor: string | null;
}

export async function listerMarques(p: ParametresMarques): Promise<{ data: MarqueListee[]; pagination: Pagination }> {
  const { liste, compte } = construireListeMarques(p);
  const [data, [{ n }]] = await Promise.all([
    prisma.$queryRaw<MarqueListee[]>(liste),
    prisma.$queryRaw<[{ n: number }]>(compte),
  ]);
  return { data, pagination: pagination(p.page, p.limit, n) };
}

// ------------------------------------------------------------------ produits

export function construireListeProduits(p: ParametresProduits): { liste: Prisma.Sql; compte: Prisma.Sql } {
  // Seuls les produits publiés — c'est du texte fixe, pas un paramètre : il ne vient pas du client.
  const filtres: Prisma.Sql[] = [Prisma.sql`p.status = 'ACTIVE'`, SQL_MARQUE_PUBLIQUE];
  if (p.sector) filtres.push(Prisma.sql`s.slug = ${p.sector}`);
  if (p.priceMin !== undefined && p.priceMin > 0) filtres.push(Prisma.sql`p.price_min >= ${p.priceMin}`);
  if (p.priceMax !== undefined && p.priceMax > 0) filtres.push(Prisma.sql`p.price_max <= ${p.priceMax}`);
  if (p.q) filtres.push(Prisma.sql`(${correspondance(Prisma.sql`p.name`, p.q)} OR ${correspondance(Prisma.sql`b.name`, p.q)})`);

  const where = Prisma.sql`WHERE ${Prisma.join(filtres, ' AND ')}`;
  const ordre =
    p.sort === 'price-asc' ? Prisma.sql`p.price_min ASC NULLS LAST, p.name ASC`
    : p.sort === 'price-desc' ? Prisma.sql`p.price_min DESC NULLS LAST, p.name ASC`
    : p.sort === 'name-asc' ? Prisma.sql`p.name ASC`
    : p.q ? Prisma.sql`GREATEST(similarity(unaccent(p.name), ${sansAccents(p.q)}), similarity(unaccent(b.name), ${sansAccents(p.q)})) DESC, p.created_at DESC`
    : Prisma.sql`p.created_at DESC`;
  const depuis = Prisma.sql`FROM products p JOIN brands b ON p.brand_id = b.id LEFT JOIN sectors s ON b.sector_id = s.id ${where}`;

  return {
    liste: Prisma.sql`
      SELECT p.id, p.name, p.slug, p.image_url AS "imageUrl", p.price_min AS "priceMin", p.price_max AS "priceMax",
             p.buy_url_dead_at AS "buyUrlDeadAt",
             b.name AS "brandName", b.slug AS "brandSlug", s.color AS "sectorColor"
      ${depuis}
      ORDER BY ${ordre}
      LIMIT ${p.limit} OFFSET ${(p.page - 1) * p.limit}`,
    compte: Prisma.sql`SELECT count(*)::int AS n ${depuis}`,
  };
}

interface LigneProduit {
  id: string; name: string; slug: string; imageUrl: string | null; priceMin: number | null; priceMax: number | null;
  buyUrlDeadAt: Date | null; brandName: string; brandSlug: string; sectorColor: string | null;
}

export interface ProduitListe {
  id: string; name: string; slug: string; imageUrl: string | null; priceMin: number | null; priceMax: number | null;
  brand: { name: string; slug: string; sector: { color: string | null } };
}

export async function listerProduits(p: ParametresProduits): Promise<{ data: ProduitListe[]; pagination: Pagination }> {
  const { liste, compte } = construireListeProduits(p);
  const [lignes, [{ n }]] = await Promise.all([
    prisma.$queryRaw<LigneProduit[]>(liste),
    prisma.$queryRaw<[{ n: number }]>(compte),
  ]);
  const data = lignes.map((l) => ({
    id: l.id, name: l.name, slug: l.slug, imageUrl: l.imageUrl, priceMin: l.priceMin, priceMax: l.priceMax,
    brand: { name: l.brandName, slug: l.brandSlug, sector: { color: l.sectorColor } },
  }));
  return { data, pagination: pagination(p.page, p.limit, n) };
}
