import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

/**
 * Abonnements des marques (administration).
 *
 * ⚠️ Cette route **n'existait pas**. La page `/admin/abonnements` l'appelait,
 * recevait une 404, et affichait cinq abonnements fictifs présentant des
 * entreprises réelles et nommées comme des clients payants, avec des
 * identifiants Stripe inventés.
 *
 * Ce qui est renvoyé ici vient de la base : le palier porté par chaque marque
 * et le tarif enregistré dans `subscription_plans`.
 *
 * Ce qui n'est **pas** renvoyé, faute d'exister : le taux d'attrition, le taux
 * de croissance et l'état de paiement Stripe. Ils demandent de vrais
 * événements et une intégration Stripe vérifiée — phase 8 (T8.2, T8.5). Mieux
 * vaut une case vide qu'un chiffre inventé.
 */

export const GET = route(async () => {
  await requireAdmin();

  const [plans, brands] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      select: { tier: true, priceMonthly: true },
    }),
    prisma.brand.findMany({
      where: { subscriptionTier: { in: ['PREMIUM', 'ROYALE'] } },
      orderBy: { subscriptionExpiresAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  const priceByTier = new Map(plans.map((plan) => [plan.tier, plan.priceMonthly ?? 0]));

  const subscriptions = brands.map((brand) => ({
    id: brand.id,
    brandId: brand.id,
    brandName: brand.name,
    brandSlug: brand.slug,
    tier: brand.subscriptionTier,
    currentPeriodEnd: brand.subscriptionExpiresAt,
    mrr: priceByTier.get(brand.subscriptionTier) ?? 0,
    createdAt: brand.createdAt,
    // `status` et `stripeCustomerId` sont volontairement absents : rien en
    // base ne permet de les établir aujourd'hui.
  }));

  const premium = subscriptions.filter((s) => s.tier === 'PREMIUM').length;
  const royale = subscriptions.filter((s) => s.tier === 'ROYALE').length;
  const brandsTotal = await prisma.brand.count();

  return NextResponse.json({
    data: subscriptions,
    stats: {
      totalMrr: subscriptions.reduce((sum, s) => sum + s.mrr, 0),
      totalSubscribers: premium + royale,
      free: brandsTotal - premium - royale,
      premium,
      royale,
      churnRate: null,
      growthRate: null,
    },
  });
});
