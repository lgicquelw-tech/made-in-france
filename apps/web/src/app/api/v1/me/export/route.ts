import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Export de toutes les données personnelles du compte connecté (RGPD, art. 15 et 20),
 * en JSON téléchargeable. L'identité vient de la session : on ne peut pas demander les
 * données d'un autre. Le mot de passe haché n'en fait pas partie — ce n'est pas une
 * donnée que la personne a fournie sous cette forme, et l'exporter ne servirait qu'à
 * l'attaquer hors ligne.
 */
export const GET = route(async () => {
  const authed = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: authed.id },
    select: {
      id: true, email: true, name: true, image: true, role: true, points: true, rank: true,
      createdAt: true, updatedAt: true,
      accounts: { select: { provider: true, type: true } },
      favorites: { select: { createdAt: true, brand: { select: { name: true, slug: true } } } },
      brandViews: { select: { viewedAt: true, brand: { select: { name: true, slug: true } } }, orderBy: { viewedAt: 'desc' } },
      ownedBrands: { select: { role: true, isActive: true, acceptedAt: true, brand: { select: { name: true, slug: true } } } },
    },
  });
  if (!user) throw notFound('Utilisateur introuvable');

  const demandes = await prisma.brandClaimRequest.findMany({
    where: { userId: user.id },
    select: {
      status: true, createdAt: true, reviewedAt: true, firstName: true, lastName: true, phone: true,
      companyRole: true, proofType: true, proofDetails: true, brand: { select: { name: true, slug: true } },
    },
  });

  const contenu = {
    exporteLe: new Date().toISOString(),
    compte: {
      id: user.id, email: user.email, nom: user.name, image: user.image, role: user.role,
      points: user.points, rang: user.rank, creeLe: user.createdAt, misAJourLe: user.updatedAt,
      connexions: user.accounts,
    },
    favoris: user.favorites.map((f) => ({ marque: f.brand.name, slug: f.brand.slug, ajouteLe: f.createdAt })),
    marquesConsultees: user.brandViews.map((v) => ({ marque: v.brand.name, slug: v.brand.slug, le: v.viewedAt })),
    marquesGerees: user.ownedBrands.map((o) => ({ marque: o.brand.name, slug: o.brand.slug, role: o.role, actif: o.isActive, depuis: o.acceptedAt })),
    demandesDeRevendication: demandes.map((d) => ({
      marque: d.brand.name, slug: d.brand.slug, statut: d.status, deposeeLe: d.createdAt, examineeLe: d.reviewedAt,
      prenom: d.firstName, nom: d.lastName, telephone: d.phone, fonction: d.companyRole, preuve: d.proofType, detailPreuve: d.proofDetails,
    })),
  };

  return new NextResponse(JSON.stringify(contenu, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="made-in-france-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
