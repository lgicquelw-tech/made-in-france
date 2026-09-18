import type Anthropic from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { sansAccents } from '@/lib/search';
import { SQL_MARQUE_PUBLIQUE } from '../marque-publique';

/**
 * Les deux outils du chat : chercher des produits, chercher des marques
 * (REBUILD.md T3.7). Portés depuis Express avec deux corrections :
 *
 *   - l'énumération des secteurs était **l'ancienne taxonomie** (« Beauté & Bien-être »,
 *     « Artisanat »…) : quatre valeurs sur huit ne correspondaient à aucun secteur en
 *     base, le filtre ne trouvait rien. Elle suit désormais les 9 secteurs canoniques ;
 *   - `search_brands` filtrait `status = 'ACTIVE'`, soit une marque sur 903, alors que
 *     tout le site sert les `PENDING_REVIEW`. Le chat voit ce que le site montre.
 *
 * La construction des requêtes est séparée de leur exécution pour être testée : chaque
 * valeur venue du modèle — donc, en dernier ressort, de l'utilisateur — est un
 * paramètre lié (constat n°4).
 */

export const SECTEURS = [
  'Mode & Accessoires', 'Maison & Jardin', 'Gastronomie', 'Cosmétique', 'Enfance',
  'Loisirs & Sport', 'Animaux', 'Santé & Nutrition', 'High-Tech',
] as const;

export const OUTILS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description: "Recherche des produits fabriqués en France. À utiliser quand l'utilisateur cherche un produit, une idée cadeau, ou veut acheter quelque chose.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Mots-clés (ex : "pull laine", "chocolat", "savon")' },
        sector: { type: 'string', enum: [...SECTEURS], description: 'Secteur du produit' },
        max_price: { type: 'number', description: 'Prix maximum en euros' },
        min_price: { type: 'number', description: 'Prix minimum en euros' },
        limit: { type: 'number', description: 'Nombre de résultats (défaut 8, max 12)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_brands',
    description: "Recherche des marques françaises. À utiliser quand l'utilisateur cherche des marques, des fabricants, des artisans, ou veut découvrir des entreprises.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Mots-clés (ex : "pull", "chocolatier", "cosmétique bio")' },
        sector: { type: 'string', enum: [...SECTEURS], description: "Secteur d'activité" },
        region: { type: 'string', description: 'Région française (ex : "Bretagne")' },
        limit: { type: 'number', description: 'Nombre de résultats (défaut 6, max 12)' },
      },
      required: ['query'],
    },
  },
];

export interface ParamsProduits { query: string; sector?: string; max_price?: number; min_price?: number; limit?: number }
export interface ParamsMarques { query: string; sector?: string; region?: string; limit?: number }

const borne = (n: unknown, defaut: number, max: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : defaut;
  return Math.min(Math.max(v, 1), max);
};

/** Mots-clés utiles : sans accent, minuscules, plus de deux lettres. */
export function motsCles(query: unknown): string[] {
  return sansAccents(String(query ?? '')).toLowerCase().split(/\s+/).filter((k) => k.length > 2).slice(0, 6);
}

/** Certains libellés arrivent encodés en HTML depuis le modèle (`&amp;`). */
const secteurPropre = (s: unknown): string | null =>
  typeof s === 'string' && s.trim() ? s.replace(/&amp;/g, '&').trim() : null;

export function construireRechercheProduits(p: ParamsProduits): Prisma.Sql {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.status = 'ACTIVE'`, SQL_MARQUE_PUBLIQUE, Prisma.sql`p.price_min > 0`, Prisma.sql`p.image_url IS NOT NULL`,
  ];
  const secteur = secteurPropre(p.sector);
  if (secteur) conditions.push(Prisma.sql`s.name = ${secteur}`);
  if (typeof p.max_price === 'number' && p.max_price > 0) conditions.push(Prisma.sql`p.price_min <= ${p.max_price}`);
  if (typeof p.min_price === 'number' && p.min_price > 0) conditions.push(Prisma.sql`p.price_min >= ${p.min_price}`);
  for (const k of motsCles(p.query)) {
    const like = `%${k}%`;
    conditions.push(Prisma.sql`(unaccent(p.name) ILIKE ${like} OR p.tags::text ILIKE ${like} OR p.materials::text ILIKE ${like} OR unaccent(p.description_short) ILIKE ${like} OR unaccent(b.name) ILIKE ${like})`);
  }
  const where = Prisma.join(conditions, ' AND ');
  // Diversification : au plus 3 produits par marque, puis mélange.
  return Prisma.sql`
    WITH classes AS (
      SELECT p.id, p.name, p.slug, p.description_short, p.image_url, p.price_min, p.price_max, p.external_buy_url,
             b.name AS brand_name, b.slug AS brand_slug, b.city AS brand_city, s.name AS sector_name, s.color AS sector_color,
             ROW_NUMBER() OVER (PARTITION BY b.id ORDER BY RANDOM()) AS rang
      FROM products p JOIN brands b ON p.brand_id = b.id LEFT JOIN sectors s ON b.sector_id = s.id
      WHERE ${where}
    )
    SELECT id, name, slug, description_short, image_url, price_min, price_max, external_buy_url,
           brand_name, brand_slug, brand_city, sector_name, sector_color
    FROM classes WHERE rang <= 3 ORDER BY RANDOM() LIMIT ${borne(p.limit, 8, 12)}`;
}

export function construireRechercheMarques(p: ParamsMarques): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  const secteur = secteurPropre(p.sector);
  if (secteur) conditions.push(Prisma.sql`s.name = ${secteur}`);
  if (typeof p.region === 'string' && p.region.trim()) conditions.push(Prisma.sql`unaccent(r.name) ILIKE ${`%${sansAccents(p.region.trim())}%`}`);
  const mots = motsCles(p.query);
  if (mots.length) {
    conditions.push(Prisma.sql`(${Prisma.join(mots.map((k) => {
      const like = `%${k}%`;
      // « marques de pulls » : une marque qui VEND des pulls compte, même si ni son
      // nom ni sa description ne contiennent le mot.
      return Prisma.sql`(unaccent(b.name) ILIKE ${like} OR unaccent(b.description_short) ILIKE ${like} OR unaccent(s.name) ILIKE ${like}
        OR EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE' AND unaccent(p.name) ILIKE ${like}))`;
    }), ' OR ')})`);
  }
  // Le filtre `b.status = 'ACTIVE'` avait été retiré quand 1 marque sur 903 l'était (T3.7) ;
  // depuis la validation en bloc du 18 septembre 2026, il dit ce qu'il doit dire.
  conditions.push(SQL_MARQUE_PUBLIQUE);
  const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
  const premier = `%${mots[0] ?? ''}%`;
  return Prisma.sql`
    SELECT b.id, b.name, b.slug, b.description_short, b.logo_url, b.website_url, b.city, b.year_founded,
           s.name AS sector_name, s.color AS sector_color, r.name AS region_name,
           (SELECT count(*)::int FROM products p WHERE p.brand_id = b.id AND p.status = 'ACTIVE') AS product_count
    FROM brands b LEFT JOIN sectors s ON b.sector_id = s.id LEFT JOIN regions r ON b.region_id = r.id
    ${where}
    ORDER BY CASE WHEN unaccent(b.name) ILIKE ${premier} THEN 0 ELSE 1 END, b.name ASC
    LIMIT ${borne(p.limit, 6, 12)}`;
}

export interface ProduitTrouve {
  id: string; name: string; slug: string; description_short: string | null; image_url: string | null;
  price_min: number | null; price_max: number | null; external_buy_url: string | null;
  brand_name: string; brand_slug: string; brand_city: string | null; sector_name: string | null; sector_color: string | null;
}
export interface MarqueTrouvee {
  id: string; name: string; slug: string; description_short: string | null; logo_url: string | null; website_url: string | null;
  city: string | null; year_founded: number | null; sector_name: string | null; sector_color: string | null; region_name: string | null; product_count: number;
}

export const chercherProduits = (p: ParamsProduits) => prisma.$queryRaw<ProduitTrouve[]>(construireRechercheProduits(p));
export const chercherMarques = (p: ParamsMarques) => prisma.$queryRaw<MarqueTrouvee[]>(construireRechercheMarques(p));
