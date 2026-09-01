import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { route, badRequest, notFound } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * Inscription d'un compte professionnel. Migré depuis Express.
 *
 * ⚠️ **Faille la plus grave du projet, fermée ici.** L'ancienne route créait
 * directement un `BrandOwner` avec `role: OWNER` et `isActive: true` dès qu'un
 * `claimBrandSlug` était fourni — sans la moindre vérification que la personne
 * a un quelconque rapport avec la marque. Une inscription suffisait à devenir
 * propriétaire de n'importe laquelle des 903 marques.
 *
 * Le schéma prévoyait pourtant le bon dispositif : `BrandClaimRequest`, avec
 * un statut `PENDING` et des champs de preuve. C'est ce qui est créé
 * désormais. La propriété n'est accordée qu'après validation humaine
 * (REBUILD.md T8.1).
 */

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide'),
  // 12 caractères, comme pour la commande de création d'administrateur.
  password: z.string().min(12, 'Le mot de passe doit faire au moins 12 caractères'),
  name: z.string().trim().min(1, 'Le nom est obligatoire').max(200),
  companyName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  siret: z.string().trim().max(20).optional(),
  claimBrandSlug: z.string().trim().max(200).optional().nullable(),
});

export const POST = route(async (request: Request) => {
  // Avant tout travail : sans cela, on peut creer des comptes en rafale.
  enforceRateLimit(request, {
    scope: 'register',
    limit: 5,
    windowMs: 60 * 60_000,
    message: "Trop de tentatives d'inscription. Réessayez dans une heure.",
  });

  const input = registerSchema.parse(await request.json());

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw badRequest('Un compte existe déjà pour cette adresse.');

  // Le slug de marque est validé AVANT de créer le compte : sinon on laisse
  // derrière soi un utilisateur orphelin quand la marque n'existe pas.
  const brand = input.claimBrandSlug
    ? await prisma.brand.findUnique({
        where: { slug: input.claimBrandSlug },
        select: { id: true },
      })
    : null;
  if (input.claimBrandSlug && !brand) throw notFound('Marque introuvable');

  const [firstName, ...rest] = input.name.split(' ');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: await bcrypt.hash(input.password, 12),
      role: 'USER',
      isActive: true,
    },
  });

  if (brand) {
    await prisma.brandClaimRequest.create({
      data: {
        brandId: brand.id,
        userId: user.id,
        email: input.email,
        firstName: firstName || input.name,
        lastName: rest.join(' ') || '—',
        phone: input.phone ?? null,
        companyRole: input.companyName ?? null,
        // La preuve reste à fournir : c'est l'objet de l'examen manuel.
        proofType: 'declaration',
        proofDetails: input.siret ? `SIRET déclaré : ${input.siret}` : null,
        status: 'PENDING',
      },
    });
  }

  return NextResponse.json(
    {
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      claim: brand
        ? {
            status: 'PENDING',
            message:
              'Votre demande de revendication a été enregistrée. Elle doit être validée avant que vous puissiez éditer la fiche.',
          }
        : null,
    },
    { status: 201 }
  );
});
