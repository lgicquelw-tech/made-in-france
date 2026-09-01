import { HttpError } from './api-response';

/**
 * Limitation de débit pour les Route Handlers (REBUILD.md T3.21).
 *
 * ⚠️ Compteur **en mémoire du processus**. Cela protège contre le martèlement
 * d'un client, ce qui est l'essentiel aujourd'hui, mais deux limites doivent
 * rester conscientes :
 *   - plusieurs instances = plusieurs compteurs indépendants ;
 *   - l'adresse IP vient d'un en-tête posé par le proxy, donc falsifiable si
 *     l'application n'est pas derrière un proxy de confiance.
 * À remplacer par un compteur partagé au moment du déploiement (phase 7).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Purge paresseuse : sans elle, la table grossit indéfiniment. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'inconnu';
  return `${scope}:${ip}`;
}

/**
 * Lève une 429 au-delà de `limit` appels par `windowMs`.
 * À appeler **avant** tout travail coûteux.
 */
export function enforceRateLimit(
  request: Request,
  options: { scope: string; limit: number; windowMs: number; message?: string }
): void {
  const now = Date.now();
  sweep(now);

  const key = clientKey(request, options.scope);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > options.limit) {
    const seconds = Math.ceil((bucket.resetAt - now) / 1000);
    throw new HttpError(
      429,
      options.message ?? `Trop de requêtes. Réessayez dans ${seconds} seconde(s).`
    );
  }
}
