/**
 * Le **seul** point d'écriture d'un produit scrappé (REBUILD.md T5.3, T5.5, T5.6).
 *
 * Les scrapers ne touchent plus à `prisma.product` : ils collectent, convertissent
 * en `ProduitCollecte`, et appellent `enregistrerCollecte`. Ici, et seulement ici :
 *
 *   1. le bruit est écarté (`noise.ts`) et la raison conservée ;
 *   2. les doublons de nom au sein du lot sont écartés ;
 *   3. la fiche est retrouvée par sa **clé stable** — marque, source, identifiant
 *      chez la source — puis créée ou mise à jour selon la règle de `merge.ts` ;
 *   4. la date de collecte est posée.
 *
 * Relancer un scraping N fois donne donc le même résultat qu'une fois — c'est ce
 * qu'« idempotent » veut dire — et ne détruit jamais un travail éditorial.
 */

import type { PrismaClient } from '@prisma/client';
import { detecterBruit, dedoublonner, type RaisonRejet } from './noise';
import { donneesCreation, donneesMiseAJour, type ProduitCollecte } from './merge';

/** Un produit collecté, plus ce que le filtre de bruit a besoin de voir. */
export interface ProduitAEnregistrer extends ProduitCollecte {
  type?: string | null;
  tags?: string[] | null;
}

export interface BilanCollecte {
  crees: number;
  misAJour: number;
  ecartes: { name: string; raison: RaisonRejet }[];
  doublons: { name: string; doublonDe: string }[];
  erreurs: { name: string; message: string }[];
}

export async function enregistrerCollecte(
  prisma: PrismaClient,
  brandId: string,
  produits: ProduitAEnregistrer[],
  collecteLe: Date = new Date(),
): Promise<BilanCollecte> {
  const bilan: BilanCollecte = { crees: 0, misAJour: 0, ecartes: [], doublons: [], erreurs: [] };

  // 1. bruit
  const legitimes: ProduitAEnregistrer[] = [];
  for (const p of produits) {
    const raison = detecterBruit({ name: p.name, type: p.type, tags: p.tags });
    if (raison) bilan.ecartes.push({ name: p.name, raison });
    else legitimes.push(p);
  }

  // 2. doublons de nom dans le lot
  const { gardes, doublons } = dedoublonner(legitimes);
  for (const d of doublons) {
    bilan.doublons.push({ name: d.produit.name, doublonDe: gardes[d.doublonDe].name });
  }

  // 3 et 4. écriture par clé stable
  for (const p of gardes) {
    try {
      const existant = await prisma.product.findUnique({
        where: {
          brandId_externalSource_externalId: {
            brandId,
            externalSource: p.externalSource,
            externalId: p.externalId,
          },
        },
        select: { id: true },
      });

      if (existant) {
        await prisma.product.update({
          where: { id: existant.id },
          data: donneesMiseAJour(p, collecteLe),
        });
        bilan.misAJour += 1;
      } else {
        await prisma.product.create({ data: donneesCreation(p, brandId, collecteLe) });
        bilan.crees += 1;
      }
    } catch (e) {
      bilan.erreurs.push({ name: p.name, message: e instanceof Error ? e.message : String(e) });
    }
  }

  return bilan;
}

/** Affichage uniforme du bilan, quel que soit le scraper. */
export function afficherBilan(nomMarque: string, b: BilanCollecte): void {
  console.log(`\n  ${nomMarque} — créés ${b.crees}, mis à jour ${b.misAJour}, ` +
    `écartés ${b.ecartes.length}, doublons ${b.doublons.length}, erreurs ${b.erreurs.length}`);
  for (const e of b.ecartes.slice(0, 10)) console.log(`    écarté (${e.raison}) : ${e.name}`);
  if (b.ecartes.length > 10) console.log(`    … et ${b.ecartes.length - 10} autres écartés`);
  for (const d of b.doublons.slice(0, 5)) console.log(`    doublon de « ${d.doublonDe} » : ${d.name}`);
  for (const e of b.erreurs.slice(0, 5)) console.log(`    erreur : ${e.name} — ${e.message}`);
}
