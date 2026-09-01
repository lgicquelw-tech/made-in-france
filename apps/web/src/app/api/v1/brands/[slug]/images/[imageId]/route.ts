import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, notFound } from '@/lib/api-response';
import { cloudinary } from '@/lib/cloudinary';

/** Suppression d'une image de marque, par son propriétaire. */

type Context = { params: { slug: string; imageId: string } };

export const DELETE = route<Context>(async (_request, { params }) => {
  // ⚠️ L'ancienne route ne verifiait aucune propriete : n'importe qui pouvait
  // supprimer les images de n'importe quelle marque, chez Cloudinary compris.
  const { brand } = await requireBrandOwner(params.slug);

  const image = await prisma.brandImage.findFirst({
    where: { id: params.imageId, brandId: brand.id },
  });
  if (!image) throw notFound('Image introuvable');

  // La base d'abord : si Cloudinary echoue, on ne veut pas d'une ligne qui
  // pointe une image supprimee. L'inverse laisserait un fichier orphelin,
  // ce qui est moins grave qu'une image cassee sur la fiche.
  await prisma.brandImage.delete({ where: { id: params.imageId } });

  if (image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      console.error('[cloudinary] suppression impossible', image.publicId, error);
    }
  }

  return NextResponse.json({ success: true });
});
