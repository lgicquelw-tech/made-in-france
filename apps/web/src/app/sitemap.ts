import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';

/**
 * Plan du site (REBUILD.md T4.12).
 *
 * ⚠️ Il ne listait que **100 marques sur 903**. Il demandait `?limit=1000` à
 * l'API, qui plafonne silencieusement à 100 : 89 % des fiches n'étaient donc
 * jamais soumises à l'indexation. Pour un annuaire dont le référencement est
 * le canal d'acquisition, c'était le défaut le plus coûteux du projet.
 *
 * Il lit désormais la base directement — c'est tout l'intérêt de l'option A :
 * pas d'aller-retour HTTP, pas de pagination à contourner.
 *
 * L'URL de production était écrite en dur : un sitemap servi en local
 * annonçait des adresses `madeinfrance.fr`. Elle vient de `lib/site.ts`.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const [brands, products, sectors, regions] = await Promise.all([
    // On liste ce que le site sert réellement. ⚠️ 902 marques sur 903 sont en
    // `PENDING_REVIEW` et pourtant publiques : c'est l'incohérence signalée en
    // phase 5. Le jour où la liste publique filtrera sur `ACTIVE`, ce filtre
    // devra suivre — sinon le sitemap annoncera des pages introuvables.
    prisma.brand.findMany({ select: { slug: true, updatedAt: true }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
      orderBy: { name: 'asc' },
    }),
    prisma.sector.findMany({ select: { slug: true } }),
    prisma.region.findMany({ select: { slug: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/marques`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/produits`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/secteurs`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/regions`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/carte`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/a-propos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/entreprises`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...sectors.map((s) => ({
      url: `${base}/secteurs/${s.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...regions.map((r) => ({
      url: `${base}/regions/${r.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...brands.map((b) => ({
      url: `${base}/marques/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/produits/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
