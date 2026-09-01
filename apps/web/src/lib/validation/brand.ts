import { z } from 'zod';

/**
 * Validation des entrées d'administration pour les marques (REBUILD.md T3.16).
 *
 * Le formulaire envoie des chaînes pour les nombres (`latitude`, `yearFounded`)
 * et des chaînes vides pour les champs non remplis : d'où les `coerce` et la
 * normalisation systématique de `''` en `null`.
 */

const BRAND_STATUS = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const;

/** Une chaîne vide venue d'un formulaire vaut « pas de valeur », pas «  ». */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional()
  .refine(
    (value) => value == null || /^https?:\/\//i.test(value),
    'URL invalide : elle doit commencer par http:// ou https://'
  );

const optionalNumber = (min: number, max: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .refine((value) => value === null || (!Number.isNaN(value) && value >= min && value <= max), {
      message: `Valeur attendue entre ${min} et ${max}`,
    });

/** Un identifiant de relation : soit un uuid, soit rien. */
const optionalRelationId = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional()
  .refine(
    (value) => value == null || z.string().uuid().safeParse(value).success,
    'Identifiant invalide'
  );

export const brandInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
    .max(200)
    .optional(),

  descriptionShort: optionalText,
  descriptionLong: optionalText,
  story: optionalText,

  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  videoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  galleryUrls: z.array(z.string().url()).optional(),

  city: optionalText,
  address: optionalText,
  postalCode: optionalText,
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  yearFounded: optionalNumber(1000, 2100),

  sectorId: optionalRelationId,
  regionId: optionalRelationId,

  socialLinks: z.record(z.string()).optional(),
  aiGeneratedContent: z.record(z.unknown()).optional(),

  status: z.enum(BRAND_STATUS).optional(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/**
 * Mise à jour : tout est facultatif, et **seuls les champs réellement envoyés
 * sont écrits**. L'ancienne route Express faisait `galleryUrls: data.galleryUrls || []`
 * et `socialLinks: data.socialLinks || {}` : une mise à jour partielle effaçait
 * silencieusement la galerie et les réseaux sociaux.
 */
export const brandUpdateSchema = brandInputSchema.partial();

export type BrandInput = z.infer<typeof brandInputSchema>;
export type BrandUpdate = z.infer<typeof brandUpdateSchema>;

export const brandListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(200).default(''),
});
