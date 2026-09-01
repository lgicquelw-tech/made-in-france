import { z } from 'zod';

/** Validation des produits côté administration (REBUILD.md T3.16). */

const PRODUCT_STATUS = ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'] as const;

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalUrl = optionalText.refine(
  (value) => value == null || /^https?:\/\//i.test(value),
  'URL invalide : elle doit commencer par http:// ou https://'
);

const optionalPrice = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  })
  .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
    message: 'Prix invalide',
  });

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

export const productCreateSchema = z
  .object({
    brandId: z.string().uuid('Marque invalide'),
    name: z.string().trim().min(1, 'Le nom est obligatoire').max(300),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
      .max(300)
      .optional(),

    descriptionShort: optionalText,
    descriptionLong: optionalText,

    imageUrl: optionalUrl,
    galleryUrls: z.array(z.string().url()).optional(),

    categoryId: optionalRelationId,

    priceMin: optionalPrice,
    priceMax: optionalPrice,
    currency: z.string().trim().length(3, 'Code devise sur 3 lettres').optional(),

    manufacturingLocation: optionalText,
    materials: z.array(z.string()).optional(),

    externalBuyUrl: optionalUrl,
    affiliateUrl: optionalUrl,

    tags: z.array(z.string()).optional(),
    attributes: z.record(z.unknown()).optional(),

    status: z.enum(PRODUCT_STATUS).optional(),
    isFeatured: z.boolean().optional(),
  })
  // L'ancienne route acceptait un prix minimum superieur au maximum sans rien
  // dire : la fiche affichait alors une fourchette absurde.
  .refine(
    (data) => data.priceMin == null || data.priceMax == null || data.priceMin <= data.priceMax,
    { message: 'Le prix minimum ne peut pas dépasser le prix maximum', path: ['priceMin'] }
  );

/** Mise à jour : la marque d'un produit ne se change pas ici. */
export const productUpdateSchema = productCreateSchema.innerType()
  .omit({ brandId: true })
  .partial()
  .refine(
    (data) => data.priceMin == null || data.priceMax == null || data.priceMin <= data.priceMax,
    { message: 'Le prix minimum ne peut pas dépasser le prix maximum', path: ['priceMin'] }
  );

export const productSearchQuerySchema = z.object({
  q: z.string().trim().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(''),
  // Chaîne vide = « tous les statuts » : c'est ce qu'envoie le filtre de la
  // page d'administration quand aucun statut n'est sélectionné.
  status: z.enum(['', ...PRODUCT_STATUS]).default(''),
  sector: z.string().trim().max(120).default(''),
});
