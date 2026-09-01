import Stripe from 'stripe';

/**
 * Client Stripe côté serveur. La version d'API est figée en un seul endroit
 * (REBUILD.md T3.18) — elle était répétée à trois instanciations dans l'API
 * Express, sous une valeur que le SDK installé n'accepte plus.
 */
export const STRIPE_API_VERSION = '2025-12-15.clover' as const;

export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY absent');
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}
