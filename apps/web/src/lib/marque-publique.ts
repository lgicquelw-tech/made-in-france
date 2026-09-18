import { Prisma, type BrandStatus } from '@prisma/client';

/**
 * Ce qu'est une marque **publique** : `ACTIVE`, et rien d'autre.
 *
 * Jusqu'au 18 septembre 2026, 902 marques sur 903 étaient `PENDING_REVIEW` et servies
 * quand même : le statut ne voulait rien dire, donc rien ne le lisait. Le propriétaire a
 * validé en bloc les fiches complètes (`pnpm data:publish:brands`) ; le statut redevient
 * une décision, et les listes publiques la respectent — annuaire, recherche, carte,
 * accueil, secteurs, régions, sitemap, assistant.
 *
 * Deux formes du même critère, pour les deux façons d'interroger la base.
 * Les lectures d'administration et du Studio ne l'utilisent **pas** : un propriétaire
 * doit voir sa fiche en attente, un administrateur doit voir les fiches suspendues.
 */
export const OU_MARQUE_PUBLIQUE = { status: 'ACTIVE' } as const;

/** La même règle en SQL, pour un alias `b` sur `brands`. */
export const SQL_MARQUE_PUBLIQUE = Prisma.sql`b.status = 'ACTIVE'`;

/**
 * La fiche elle-même reste **accessible** par son adresse tant qu'elle n'a pas été
 * retirée : une marque en attente existe, elle n'est simplement pas mise en avant.
 * Une marque suspendue ou refusée n'existe plus pour le public : 404.
 */
export const OU_MARQUE_ACCESSIBLE = { status: { notIn: ['SUSPENDED', 'REJECTED'] as BrandStatus[] } };
