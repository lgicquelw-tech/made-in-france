import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { stripeClient } from '@/lib/stripe';

/**
 * Portail de gestion d'abonnement. Migré depuis Express.
 *
 * ⚠️ L'ancienne route prenait `brandSlug` dans le corps sans authentification :
 * n'importe qui pouvait ouvrir le portail de facturation de n'importe quelle
 * marque abonnée, et y voir ses moyens de paiement et son historique.
 */

const portalSchema = z.object({ brandSlug: z.string().trim().min(1) });

export const POST = route(async (request: Request) => {
  const { brandSlug } = portalSchema.parse(await request.json());
  const { brand } = await requireBrandOwner(brandSlug);

  const row = await prisma.brand.findUnique({
    where: { id: brand.id },
    select: { stripeCustomerId: true },
  });
  if (!row?.stripeCustomerId) throw notFound('Aucun abonnement pour cette marque.');

  const stripe = stripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${appUrl}/studio/marque/${brand.slug}/abonnement`,
  });

  return NextResponse.json({ url: session.url });
});
