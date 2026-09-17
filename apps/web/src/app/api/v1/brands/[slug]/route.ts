import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { route, notFound } from '@/lib/api-response';

// Une réponse d'API n'est jamais figée au build : sans cette ligne, un GET qui ne lit
// pas la requête est prérendu une fois et sert à jamais l'état de la base du build.
export const dynamic = 'force-dynamic';

/**
 * Fiche marque, forme publique (REBUILD.md T3.8). L'ancienne route Express renvoyait
 * **le modèle entier** — `stripeCustomerId`, `stripeSubscriptionId`, affiliation, contenu
 * généré — à quiconque connaissait un slug. On ne renvoie que ce que le site affiche.
 */
type Context = { params: { slug: string } };

export const GET = route<Context>(async (_request, { params }) => {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    select: {
      id: true, name: true, slug: true, tagline: true, descriptionShort: true, descriptionLong: true, story: true,
      logoUrl: true, coverImageUrl: true, galleryUrls: true, videoUrl: true,
      city: true, address: true, postalCode: true, latitude: true, longitude: true,
      regionId: true, sectorId: true, madeInFranceLevel: true, yearFounded: true, employeeRange: true,
      websiteUrl: true, websiteDeadAt: true, socialLinks: true,
      status: true, isVerified: true, subscriptionTier: true, aiGeneratedContent: true,
      createdAt: true, updatedAt: true,
      region: { select: { id: true, name: true, slug: true } },
      sector: { select: { id: true, name: true, slug: true, color: true } },
      labels: { select: { label: { select: { id: true, name: true, slug: true } } } },
    },
  });
  if (!brand) throw notFound('Marque introuvable');
  return NextResponse.json({ data: brand });
});
