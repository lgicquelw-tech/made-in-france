import { Prisma } from '@prisma/client';
import { SQL_MARQUE_PUBLIQUE } from './marque-publique';
import { z } from 'zod';

import { prisma } from './db';
import { sansAccents } from './search';

/**
 * Le fil de produits de l'accueil (REBUILD.md T8.9) — déterministe, sans modèle.
 *
 * Chaque produit publié reçoit un **score** :
 *
 *   +4  sa marque fait partie de celles que l'utilisateur a consultées
 *   +3  son secteur fait partie de ceux qu'il a consultés
 *   +2  son nom contient un mot de ses recherches récentes
 *   +1  il est récent (30 jours)     +1  il est mis en avant
 *
 * puis une **pénalité de diversité** : le deuxième produit d'une même marque perd 1,5
 * point, le troisième 3, etc. Sans elle, une marque de 200 produits occuperait tout
 * l'écran. Et l'utilisateur sans aucun signal voit un fil où tout le monde est à
 * égalité — mélangé, mais **stable dans la journée** : le départage se fait par un hachage
 * du produit et de la date, jamais par `RANDOM()`, sinon le défilement infini ferait
 * réapparaître les mêmes produits d'une page à l'autre.
 *
 * Seuls les produits `ACTIVE` **avec image et prix** entrent : un fil d'entrée montre le
 * meilleur du catalogue, pas ses trous.
 */

const liste = z.string().max(500).optional().transform((v) =>
  (v ?? '').split(',').map((x) => x.trim()).filter((x) => /^[a-z0-9-]{1,60}$/.test(x)).slice(0, 10),
);

export const parametresFil = z.object({
  s: liste, // secteurs
  m: liste, // marques
  q: liste, // mots
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});
export type ParametresFil = z.infer<typeof parametresFil>;

export function construireFil(p: ParametresFil, jour = new Date().toISOString().slice(0, 10)): { liste: Prisma.Sql; compte: Prisma.Sql } {
  const termes: Prisma.Sql[] = [
    Prisma.sql`(CASE WHEN p.created_at > now() - interval '30 days' THEN 1 ELSE 0 END)`,
    Prisma.sql`(CASE WHEN p.is_featured THEN 1 ELSE 0 END)`,
  ];
  if (p.m.length) termes.push(Prisma.sql`(CASE WHEN b.slug IN (${Prisma.join(p.m)}) THEN 4 ELSE 0 END)`);
  if (p.s.length) termes.push(Prisma.sql`(CASE WHEN s.slug IN (${Prisma.join(p.s)}) THEN 3 ELSE 0 END)`);
  if (p.q.length) {
    const motifs = p.q.map((mot) => Prisma.sql`unaccent(p.name) ILIKE ${`%${sansAccents(mot)}%`}`);
    termes.push(Prisma.sql`(CASE WHEN ${Prisma.join(motifs, ' OR ')} THEN 2 ELSE 0 END)`);
  }
  const score = Prisma.join(termes, ' + ');
  const depuis = Prisma.sql`FROM products p JOIN brands b ON p.brand_id = b.id LEFT JOIN sectors s ON b.sector_id = s.id
    WHERE p.status = 'ACTIVE' AND ${SQL_MARQUE_PUBLIQUE} AND p.image_url IS NOT NULL AND p.price_min > 0 AND p.buy_url_dead_at IS NULL`;

  return {
    liste: Prisma.sql`
      WITH notes AS (
        SELECT p.id, p.name, p.slug, p.image_url AS "imageUrl", p.price_min AS "priceMin", p.price_max AS "priceMax",
               b.name AS "brandName", b.slug AS "brandSlug", s.slug AS "sectorSlug", s.color AS "sectorColor",
               (${score}) AS score,
               md5(p.id::text || ${jour}) AS aleas,
               ROW_NUMBER() OVER (PARTITION BY p.brand_id ORDER BY (${score}) DESC, md5(p.id::text || ${jour})) AS rang
        ${depuis}
      )
      SELECT id, name, slug, "imageUrl", "priceMin", "priceMax", "brandName", "brandSlug", "sectorSlug", "sectorColor",
             (score - (rang - 1) * 1.5)::float AS "scoreFinal"
      FROM notes
      ORDER BY "scoreFinal" DESC, aleas
      LIMIT ${p.limit} OFFSET ${(p.page - 1) * p.limit}`,
    compte: Prisma.sql`SELECT count(*)::int AS n ${depuis}`,
  };
}

export interface ProduitDuFil {
  id: string; name: string; slug: string; imageUrl: string | null; priceMin: number | null; priceMax: number | null;
  brandName: string; brandSlug: string; sectorSlug: string | null; sectorColor: string | null; scoreFinal: number;
}

export async function lireFil(p: ParametresFil): Promise<{ data: ProduitDuFil[]; total: number; personnalise: boolean }> {
  const { liste: requete, compte } = construireFil(p);
  const [data, [{ n }]] = await Promise.all([prisma.$queryRaw<ProduitDuFil[]>(requete), prisma.$queryRaw<[{ n: number }]>(compte)]);
  return { data, total: n, personnalise: p.s.length + p.m.length + p.q.length > 0 };
}
