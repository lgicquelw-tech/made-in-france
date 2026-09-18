import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Les marques effectivement gérées par quelqu'un dans le Studio : qui, quel palier,
 * combien de produits. La page `/admin/studios` lisait `/api/admin/brands` — qui ne
 * renvoie ni propriétaire ni compteurs — et, quand l'appel échouait, **inventait six
 * marques réelles avec des noms de dirigeants et des adresses e-mail**. Retiré le
 * 18 septembre 2026. Un écran vide vaut mieux qu'un écran qui ment.
 */
export const GET = route(async () => {
  await requireAdmin();

  const marques = await prisma.brand.findMany({
    where: { owners: { some: { isActive: true } } },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, slug: true, logoUrl: true, websiteUrl: true, subscriptionTier: true, isVerified: true,
      owners: { where: { isActive: true }, select: { role: true, acceptedAt: true, user: { select: { name: true, email: true } } } },
      _count: { select: { products: true, views: true } },
    },
  });

  const enAttente = await prisma.brandClaimRequest.count({ where: { status: 'PENDING' } });

  return NextResponse.json({ data: marques, enAttente });
});
