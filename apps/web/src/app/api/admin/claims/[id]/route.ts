import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { journaliser } from '@/lib/audit';
import { route, badRequest, notFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

type Context = { params: { id: string } };

const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * La décision humaine sur une revendication (REBUILD.md T8.1) — **le seul endroit du code
 * qui crée un `BrandOwner`.**
 *
 * Approuver : la demande passe `APPROVED`, le compte qui l'a déposée devient `OWNER` de la
 * marque (une fois : relancer ne crée pas de doublon). Refuser : `REJECTED`, avec la raison.
 * Dans les deux cas, qui a décidé et quand, et une ligne d'audit sur la marque.
 *
 * On n'approuve pas une demande sans compte (`userId` null — le compte a été supprimé) :
 * il n'y a personne à qui donner le droit.
 */
export const POST = route<Context>(async (request, { params }) => {
  const acteur = await requireAdmin();
  const { decision, notes } = decisionSchema.parse(await request.json());

  const demande = await prisma.brandClaimRequest.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, userId: true, email: true, brand: { select: { id: true, name: true, slug: true } } },
  });
  if (!demande) throw notFound('Demande introuvable');
  if (demande.status !== 'PENDING') throw badRequest(`Cette demande a déjà été traitée (${demande.status}).`);
  if (decision === 'APPROVED' && !demande.userId) {
    throw badRequest("Le compte qui a déposé cette demande n'existe plus : rien à accorder.");
  }

  const resultat = await prisma.$transaction(async (tx) => {
    const apres = await tx.brandClaimRequest.update({
      where: { id: demande.id },
      data: { status: decision, reviewedBy: acteur.id, reviewedAt: new Date(), reviewNotes: notes ?? null },
    });

    if (decision === 'APPROVED' && demande.userId) {
      await tx.brandOwner.upsert({
        where: { brandId_userId: { brandId: demande.brand.id, userId: demande.userId } },
        create: { brandId: demande.brand.id, userId: demande.userId, role: 'OWNER', isActive: true, invitedBy: acteur.id, acceptedAt: new Date() },
        update: { role: 'OWNER', isActive: true, acceptedAt: new Date() },
      });
    }

    await journaliser(tx, {
      acteur,
      action: decision === 'APPROVED' ? 'claim.approve' : 'claim.reject',
      cible: { type: 'brand', id: demande.brand.id, libelle: demande.brand.name },
      changements: {
        revendication: { avant: 'PENDING', apres: decision },
        demandeur: { avant: null, apres: demande.email },
        ...(notes ? { notes: { avant: null, apres: notes } } : {}),
      },
    });

    return apres;
  });

  return NextResponse.json({ data: { id: resultat.id, status: resultat.status, reviewedAt: resultat.reviewedAt } });
});
