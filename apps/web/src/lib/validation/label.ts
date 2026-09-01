import { z } from 'zod';

/** Validation des labels (REBUILD.md T3.16). */

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

export const labelCreateSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'Le slug est obligatoire')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (minuscules, chiffres et tirets)'),
  description: optionalText,
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
});

export const labelUpdateSchema = labelCreateSchema.partial();

/** Association d'un label à une marque ou à un produit. */
export const labelLinkSchema = z.object({
  labelId: z.string().uuid('Identifiant de label invalide'),
});
