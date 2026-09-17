import { HOTES_IMAGES } from '../../hotes-images';

/**
 * Une image peut-elle passer par `next/image` ? Même liste que `next.config.js`
 * (voir `hotes-images.js`). Un hôte inconnu doit être servi en `<img>` : `next/image`
 * lèverait, et emporterait la page.
 */
const MOTIFS = HOTES_IMAGES.map(({ hostname }) =>
  new RegExp('^' + hostname.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/(?<!\.)\*/g, '[^.]*') + '$'),
);

export function imageOptimisable(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && MOTIFS.some((m) => m.test(u.hostname));
  } catch {
    return false;
  }
}
