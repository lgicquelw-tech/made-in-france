import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, badRequest } from '@/lib/api-response';
import { stripeClient } from '@/lib/stripe';

/**
 * Ouverture d'une session de paiement. Migré depuis Express (REBUILD.md T8.6).
 *
 * ⚠️ L'ancienne route prenait `brandSlug`, `plan`, `billingCycle` **et
 * `userEmail`** dans le corps, sans aucune authentification. Conséquences :
 * n'importe qui pouvait ouvrir un paiement au nom de n'importe quelle marque,
 * et surtout **écraser son `stripeCustomerId`** — de quoi rattacher une marque
 * à un client Stripe étranger.
 *
 * Désormais : la marque vient de la propriété vérifiée en base, l'adresse
 * e-mail de la session, et **le prix de la table `subscription_plans`**, jamais
 * de la requête. Les montants étaient auparavant écrits en dur dans le code,
 * sans lien avec les tarifs affichés.
 */

const checkoutSchema = z.object({
  brandSlug: z.string().trim().min(1),
  plan: z.enum(['PREMIUM', 'ROYALE']),
  billingCycle: z.enum(['monthly', 'yearly']),
});

export const POST = route(async (request: Request) => {
  const body = checkoutSchema.parse(await request.json());
  const { user, brand } = await requireBrandOwner(body.brandSlug);

  const planRow = await prisma.subscriptionPlan.findUnique({
    where: { tier: body.plan },
    select: { name: true, priceMonthly: true, priceYearly: true },
  });
  if (!planRow) throw badRequest('Palier inconnu.');

  const yearly = body.billingCycle === 'yearly';
  const price = yearly ? planRow.priceYearly : planRow.priceMonthly;
  if (!price || price <= 0) {
    throw badRequest("Ce palier n'a pas de tarif enregistré : paiement impossible.");
  }

  const stripe = stripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let customerId = await prisma.brand
    .findUnique({ where: { id: brand.id }, select: { stripeCustomerId: true } })
    .then((b) => b?.stripeCustomerId ?? null);

  if (!customerId) {
    const customer = await stripe.customers.create({
      // L'e-mail vient de la session, pas du corps de la requête.
      email: user.email ?? undefined,
      metadata: { brandId: brand.id, brandSlug: brand.slug },
    });
    customerId = customer.id;
    await prisma.brand.update({
      where: { id: brand.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Made in France Studio — ${planRow.name}`,
            description: yearly ? 'Abonnement annuel' : 'Abonnement mensuel',
          },
          // Stripe attend des centimes.
          unit_amount: Math.round(price * 100),
          recurring: { interval: yearly ? 'year' : 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/studio/marque/${brand.slug}/abonnement?success=true`,
    cancel_url: `${appUrl}/studio/marque/${brand.slug}/abonnement?canceled=true`,
    metadata: {
      brandId: brand.id,
      brandSlug: brand.slug,
      plan: body.plan,
      billingCycle: body.billingCycle,
    },
  });

  return NextResponse.json({ url: session.url });
});
