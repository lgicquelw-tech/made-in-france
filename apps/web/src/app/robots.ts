import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * Il n'y avait pas de `robots.txt` (REBUILD.md T4.12).
 *
 * Les espaces privés sont exclus de l'indexation — ils sont déjà fermés par le
 * middleware, mais un moteur n'a rien à y faire, et leurs URL n'ont pas à
 * apparaître dans un rapport d'exploration.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/studio', '/api/', '/profil', '/favoris', '/connexion', '/connexion-pro'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
