/**
 * Construction de la requête d'enrichissement (REBUILD.md T5.7).
 *
 * Module pur : il produit le texte envoyé au modèle et le schéma de la réponse, sans
 * rien envoyer. C'est ce que `--simuler` affiche, et ce que les tests vérifient.
 *
 * Deux principes dans les consignes :
 *
 *   1. **Ne rien inventer.** Le modèle ne connaît le produit que par ce qu'on lui
 *      donne. Une matière qui n'est pas dans la description est une matière inventée ;
 *      il doit alors laisser la liste vide. Un annuaire qui affirme « lin » sur un
 *      produit en polyester perd plus qu'un annuaire qui ne dit rien.
 *   2. **Ne demander que les champs manquants.** La consigne varie donc d'un produit à
 *      l'autre, dans le message utilisateur ; le message système, lui, est stable — et
 *      donc mis en cache d'un appel à l'autre.
 */

import { z } from 'zod';
import type { ChampEnrichissable } from './champs';

/** La forme exacte attendue en retour. */
export const SchemaEnrichissement = z.object({
  descriptionShort: z.string().nullable().describe('Description courte, 1 à 2 phrases, 40 à 300 caractères, en français.'),
  tags: z.array(z.string()).describe('3 à 6 mots-clés en minuscules, sans doublon avec le nom de la marque.'),
  materials: z.array(z.string()).describe('Matières ou ingrédients cités DANS le texte fourni. Vide si le texte n\'en cite aucun.'),
  sellingPoints: z.array(z.string()).describe('2 à 3 arguments factuels, tirés du texte fourni.'),
  seoTitle: z.string().nullable().describe('Titre pour un moteur de recherche, 70 caractères maximum, contenant le nom du produit et de la marque.'),
  seoDescription: z.string().nullable().describe('Description pour un moteur de recherche, 160 caractères maximum.'),
});

export type Enrichissement = z.infer<typeof SchemaEnrichissement>;

/** Stable d'un appel à l'autre : c'est ce qui permet la mise en cache du préfixe. */
export const MESSAGE_SYSTEME = `Tu complètes les fiches d'un annuaire de produits fabriqués en France.

Règles :
- Tu écris en français, sans emoji, sans point d'exclamation.
- Tu ne connais le produit que par le texte fourni. Tu n'inventes rien : pas de matière, d'origine, de certification ni de caractéristique qui n'y figure pas. Si l'information manque, tu laisses le champ vide ou null.
- Tu ne cites pas de prix.
- Tu ne renseignes que les champs demandés dans le message ; les autres sont null ou une liste vide.`;

export interface ContexteProduit {
  name: string;
  descriptionShort: string | null;
  descriptionLong: string | null;
  marque: string;
  secteur: string | null;
  categorie: string | null;
}

const LIBELLES: Record<ChampEnrichissable, string> = {
  descriptionShort: 'descriptionShort',
  tags: 'tags',
  materials: 'materials',
  aiSellingPoints: 'sellingPoints',
  seoTitle: 'seoTitle',
  seoDescription: 'seoDescription',
};

/** Le message utilisateur : le produit tel qu'on le connaît, et ce qu'on attend. */
export function messageUtilisateur(p: ContexteProduit, manques: ChampEnrichissable[]): string {
  const texte = (p.descriptionLong || p.descriptionShort || '').trim();
  return [
    `Produit : ${p.name}`,
    `Marque : ${p.marque}`,
    p.secteur ? `Secteur : ${p.secteur}` : null,
    p.categorie ? `Catégorie : ${p.categorie}` : null,
    '',
    'Texte connu sur ce produit :',
    texte ? texte.slice(0, 4000) : '(aucun texte — ne renseigne que ce que le nom permet de dire avec certitude)',
    '',
    `Champs à renseigner : ${manques.map((m) => LIBELLES[m]).join(', ')}.`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

/** Estimation grossière, sans réseau : ~4 caractères par jeton pour du français. */
export function estimerJetons(texte: string): number {
  return Math.ceil(texte.length / 4);
}
