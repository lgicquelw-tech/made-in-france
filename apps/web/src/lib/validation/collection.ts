import { z } from 'zod';

/** Validation des collections et des mises en avant (REBUILD.md T3.16). */

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

/**
 * Une date ISO, ou rien.
 *
 * L'ancienne route faisait `new Date(data.startDate)` sans vérifier : une date
 * absente ou mal formée produisait un `Invalid Date`, que Prisma rejetait en
 * 500 illisible.
 */
const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (value == null || value === '' ? null : new Date(value)))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), 'Date invalide');

const requiredDate = z
  .string()
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), 'Date invalide');

const dateOrderCheck = <T extends { startDate?: Date | null; endDate?: Date | null }>(data: T) =>
  data.startDate == null || data.endDate == null || data.startDate <= data.endDate;

export const collectionCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'Le nom est obligatoire').max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide')
      .max(200)
      .optional(),
    description: optionalText,
    imageUrl: optionalUrl,
    color: optionalText,
    isActive: z.boolean().optional(),
    startDate: optionalDate,
    endDate: optionalDate,
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine(dateOrderCheck, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  });

export const collectionUpdateSchema = collectionCreateSchema
  .innerType()
  .partial()
  .refine(dateOrderCheck, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  });

export const collectionBrandsSchema = z.object({
  brandIds: z.array(z.string().uuid('Identifiant de marque invalide')).min(1, 'Aucune marque'),
});

export const featuredCreateSchema = z
  .object({
    brandId: z.string().uuid('Marque invalide'),
    title: optionalText,
    description: optionalText,
    imageUrl: optionalUrl,
    featuredType: z.string().trim().max(40).optional(),
    isActive: z.boolean().optional(),
    startDate: requiredDate,
    endDate: requiredDate,
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  });

export const featuredUpdateSchema = featuredCreateSchema
  .innerType()
  .partial()
  .refine(dateOrderCheck, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  });
