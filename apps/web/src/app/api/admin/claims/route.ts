import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const listeSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).default('PENDING'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * Les demandes de revendication à examiner (REBUILD.md T8.1, règle n°0 de CLAUDE.md).
 *
 * Depuis le 1er septembre 2026, une revendication crée une demande `PENDING` au lieu
 * d'accorder la propriété — mais rien ne permettait à un humain de l'examiner autrement
 * qu'en SQL. La file s'allongeait sans issue. Voici la lecture ; la décision est dans
 * `[id]/route.ts`.
 */
export const GET = route(async (request: Request) => {
  await requireAdmin();
  const { status, limit } = listeSchema.parse(Object.fromEntries(new URL(request.url).searchParams));

  const demandes = await prisma.brandClaimRequest.findMany({
    where: { status },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true, status: true, createdAt: true, reviewedAt: true, reviewNotes: true,
      email: true, firstName: true, lastName: true, phone: true, companyRole: true,
      proofType: true, proofDetails: true, userId: true,
      brand: { select: { id: true, name: true, slug: true, websiteUrl: true, owners: { where: { isActive: true }, select: { id: true } } } },
    },
  });

  return NextResponse.json({
    data: demandes.map((d) => ({
      ...d,
      // Ce que l'examinateur doit savoir d'un coup d'œil.
      domaineDemandeur: d.email.includes('@') ? d.email.split('@')[1] : null,
      domaineMarque: domaine(d.brand.websiteUrl),
      marqueDejaGeree: d.brand.owners.length > 0,
      compteExiste: d.userId !== null,
    })),
  });
});

function domaine(url: string | null): string | null {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
}
