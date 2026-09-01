import { z } from 'zod';

import { brandUpdateSchema } from './brand';

/**
 * Champs qu'un propriétaire de marque peut modifier depuis le Studio.
 *
 * Volontairement plus étroit que le schéma d'administration : un propriétaire
 * ne change ni son statut, ni sa mise en avant, ni sa vérification, ni son
 * palier d'abonnement — sinon n'importe quelle marque se déclarerait
 * « vérifiée » et « en vedette ».
 *
 * L'ancienne liste blanche autorisait `description`, `email`, `phone` et
 * `photos`, **qui n'existent pas sur le modèle** : les envoyer faisait échouer
 * toute la mise à jour avec une erreur Prisma illisible.
 */
export const brandDashboardUpdateSchema = brandUpdateSchema.pick({
  name: true,
  descriptionShort: true,
  descriptionLong: true,
  story: true,
  address: true,
  postalCode: true,
  city: true,
  latitude: true,
  longitude: true,
  websiteUrl: true,
  videoUrl: true,
  socialLinks: true,
  sectorId: true,
  regionId: true,
  yearFounded: true,
  logoUrl: true,
  coverImageUrl: true,
  galleryUrls: true,
});

export type BrandDashboardUpdate = z.infer<typeof brandDashboardUpdateSchema>;
