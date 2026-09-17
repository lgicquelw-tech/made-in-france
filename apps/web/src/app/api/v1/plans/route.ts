import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Les paliers d'abonnement et leurs tarifs, tels qu'ils seront facturés (T8.5).
 *
 * La page d'abonnement du Studio affichait des prix **écrits en dur** (29, 290, 99, 990)
 * pendant que la caisse lisait `subscription_plans` : changer un tarif en base aurait
 * fait payer un montant différent de celui annoncé. Un seul tarif, une seule source.
 *
 * Lecture publique, donc soigneusement bornée : ni identifiants de prix Stripe, ni
 * quoi que ce soit d'interne.
 */
export const GET = route(async () => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      tier: true, name: true, description: true,
      priceMonthly: true, priceYearly: true,
      maxProducts: true, maxTeamMembers: true,
      hasAnalytics: true, hasAdvancedAnalytics: true, hasCampaigns: true, hasApiAccess: true,
      isPopular: true, displayOrder: true,
    },
  });

  return NextResponse.json({ data: plans });
});
