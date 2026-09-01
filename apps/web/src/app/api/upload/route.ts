import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/guards';
import { route, badRequest } from '@/lib/api-response';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from '@/lib/cloudinary';

/**
 * Envoi d'un média depuis l'administration. Migré depuis Express (T3.20).
 *
 * ⚠️ L'ancienne route était **ouverte à tout le monde** : n'importe qui
 * pouvait déposer des fichiers sur le compte Cloudinary du projet, dans le
 * dossier de son choix (`?folder=` n'était pas contrôlé), et avec
 * `resource_type: 'auto'` — donc pas seulement des images.
 *
 * Désormais : réservée aux administrateurs, dossier pris dans une liste
 * blanche, type MIME et taille vérifiés.
 */

// `?folder=` arrivait tel quel dans le chemin Cloudinary. Liste blanche.
const ALLOWED_FOLDERS = [
  'made-in-france',
  'brands/logos',
  'brands/covers',
  'brands/gallery',
  'products/images',
  'products/gallery',
  'labels',
  'collections',
];

export const POST = route(async (request: Request) => {
  await requireAdmin();

  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') ?? 'made-in-france';
  if (!ALLOWED_FOLDERS.includes(folder)) {
    throw badRequest(`Dossier non autorisé. Valeurs possibles : ${ALLOWED_FOLDERS.join(', ')}.`);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) throw badRequest('Aucun fichier envoyé.');
  if (file.size === 0) throw badRequest('Fichier vide.');
  if (file.size > MAX_IMAGE_BYTES) {
    throw badRequest(`Fichier trop volumineux (maximum ${MAX_IMAGE_BYTES / 1024 / 1024} Mo).`);
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw badRequest(`Type de fichier refusé (${file.type || 'inconnu'}). Attendu : JPEG, PNG, WebP ou AVIF.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(buffer, {
    folder: `mif/${folder}`,
    transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
  });

  return NextResponse.json({
    data: { url: result.secure_url, publicId: result.public_id },
  });
});
