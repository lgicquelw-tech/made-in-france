import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

/** Statistiques du tableau de bord d'administration. Migré depuis Express. */

export const GET = route(async () => {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    brandsTotal,
    brandsActive,
    brandsPending,
    brandsThisMonth,
    productsTotal,
    productsActive,
    productsFeatured,
    usersTotal,
    usersThisMonth,
    premiumCount,
    royaleCount,
  ] = await Promise.all([
    prisma.brand.count(),
    // L'ancienne route renvoyait `active: brandsTotal` et `pending: 0` :
    // elle comptait toutes les marques comme actives, quel que soit leur
    // statut réel. Le tableau de bord affichait donc un chiffre faux.
    prisma.brand.count({ where: { status: 'ACTIVE' } }),
    prisma.brand.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.brand.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.product.count({ where: { isFeatured: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.brand.count({ where: { subscriptionTier: 'PREMIUM' } }),
    prisma.brand.count({ where: { subscriptionTier: 'ROYALE' } }),
  ]);

  return NextResponse.json({
    data: {
      brands: {
        total: brandsTotal,
        active: brandsActive,
        pending: brandsPending,
        thisMonth: brandsThisMonth,
      },
      products: { total: productsTotal, active: productsActive, featured: productsFeatured },
      users: { total: usersTotal, thisMonth: usersThisMonth, active: usersTotal },
      subscriptions: {
        free: brandsTotal - premiumCount - royaleCount,
        premium: premiumCount,
        royale: royaleCount,
        // Tarifs de docs/SPEC-V1.md. Le revenu réel viendra de Stripe en
        // phase 8 ; ce calcul suppose que tout abonnement est mensuel.
        mrr: premiumCount * 29 + royaleCount * 99,
      },
      // Zéros assumés : il n'existe aucune instrumentation d'événements.
      // Les vrais chiffres arrivent en phase 8 (T8.2), pas avant.
      analytics: { pageViews: 0, clickOuts: 0, favorites: 0, searches: 0 },
      ai: { conversations: 0, tokensUsed: 0, cost: 0 },
    },
  });
});
