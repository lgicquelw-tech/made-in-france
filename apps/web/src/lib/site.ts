/**
 * URL publique du site, en un seul endroit.
 *
 * Elle était écrite en dur (`https://madeinfrance.fr`) dans `sitemap.ts`, ce
 * qui produisait des URL de production dans un sitemap servi en local.
 *
 * `absoluteUrl` vit déjà dans `lib/utils.ts` : on ne le duplique pas
 * (CLAUDE.md, règle 8).
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}
