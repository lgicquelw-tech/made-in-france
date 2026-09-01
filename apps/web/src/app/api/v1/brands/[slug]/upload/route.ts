import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { requireBrandOwner } from '@/lib/guards';
import { route, badRequest, forbidden } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from '@/lib/cloudinary';

/**
 * Envoi d'une image de marque (logo ou photo). Migré depuis Express (T3.20).
 *
 * ⚠️ L'ancienne route n'avait **aucun contrôle d'identité** : n'importe qui
 * pouvait envoyer des images sur n'importe quelle marque, et donc consommer
 * le quota Cloudinary du projet. Elle ne vérifiait pas non plus le type réel
 * du fichier — seulement une taille maximale côté multer.
 */

type Context = { params: { slug: string } };

const PHOTO_LIMIT_BY_TIER: Record<string, number> = {
  FREE: 1,
  PREMIUM: 10,
  ROYALE: 50,
};

export const POST = route<Context>(async (request, { params }) => {
  const { brand } = await requireBrandOwner(params.slug);
  enforceRateLimit(request, { scope: 'upload-marque', limit: 20, windowMs: 60_000 });

  const formData = await request.formData();
  const file = formData.get('image');
  const type = String(formData.get('type') ?? 'photo');

  if (!(file instanceof File)) throw badRequest('Aucun fichier envoyé.');
  if (file.size === 0) throw badRequest('Fichier vide.');
  if (file.size > MAX_IMAGE_BYTES) {
    throw badRequest(`Fichier trop volumineux (maximum ${MAX_IMAGE_BYTES / 1024 / 1024} Mo).`);
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw badRequest(`Type de fichier refusé (${file.type || 'inconnu'}). Attendu : JPEG, PNG, WebP ou AVIF.`);
  }
  if (type !== 'logo' && type !== 'photo') {
    throw badRequest("Le type doit valoir « logo » ou « photo ».");
  }

  const full = await prisma.brand.findUnique({
    where: { id: brand.id },
    select: { subscriptionTier: true },
  });

  if (type === 'photo') {
    const limit = PHOTO_LIMIT_BY_TIER[full?.subscriptionTier ?? 'FREE'] ?? 1;
    const existing = await prisma.brandImage.count({ where: { brandId: brand.id } });
    if (existing >= limit) {
      throw forbidden(`Limite de ${limit} photo(s) atteinte pour cet abonnement.`);
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadImage(buffer, {
    folder: `mif/brands/${params.slug}`,
    transformation:
      type === 'logo'
        ? [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
        : [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  });

  if (type === 'logo') {
    await prisma.brand.update({
      where: { id: brand.id },
      data: { logoUrl: result.secure_url },
    });
  } else {
    await prisma.brandImage.create({
      data: {
        brandId: brand.id,
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: false,
      },
    });
  }

  return NextResponse.json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  });
});
