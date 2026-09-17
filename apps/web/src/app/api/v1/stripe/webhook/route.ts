import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { prisma } from '@/lib/db';
import { stripeClient } from '@/lib/stripe';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Webhook Stripe (REBUILD.md T3.8, T8.5). Dernière route migrée depuis Express.
 *
 * Le corps est lu **brut** (`request.text()`) : la signature est calculée sur les
 * octets exacts, tout parsing préalable la casse. Et un webhook non vérifiable échoue —
 * l'ancien repli qui acceptait un événement non signé permettait de s'octroyer un
 * abonnement Royale sur n'importe quelle marque (T8.5).
 *
 * Pas de `route()` ici : Stripe attend des réponses courtes et précises, et un 500
 * générique sur une erreur de signature le ferait réessayer indéfiniment.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[stripe] STRIPE_WEBHOOK_SECRET absent : webhook refusé');
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
  }
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Signature absente' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (e) {
    console.error('[stripe] signature du webhook invalide', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { brandId, plan } = session.metadata ?? {};
      if (brandId && (plan === 'PREMIUM' || plan === 'ROYALE')) {
        await prisma.brand.update({
          where: { id: brandId },
          data: { subscriptionTier: plan, stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null },
        });
        console.info('[stripe] abonnement activé', { brandId, plan });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.status !== 'active') {
        const r = await prisma.brand.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { subscriptionTier: 'FREE' } });
        if (r.count) console.info('[stripe] abonnement inactif, retour au palier gratuit', { subscription: sub.id });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const r = await prisma.brand.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { subscriptionTier: 'FREE', stripeSubscriptionId: null } });
      if (r.count) console.info('[stripe] abonnement résilié', { subscription: sub.id });
      break;
    }
  }
  return NextResponse.json({ received: true });
}
