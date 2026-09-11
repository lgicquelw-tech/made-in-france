#!/usr/bin/env tsx
/**
 * Enrichissement des fiches produit par un modèle — `pnpm data:enrich` (REBUILD.md T5.7).
 *
 * Ne remplit **que les champs manquants** (`champs.ts`), n'écrit jamais sur un champ
 * existant, et trace dans `attributes.enrichissement` le modèle et la date de chaque
 * passage. Un produit déjà complet n'est même pas envoyé.
 *
 * **Ce script coûte de l'argent** : chaque produit est un appel facturé. D'où :
 *   - `--simuler` par défaut ? Non — mais sans `--appliquer`, rien n'est envoyé.
 *     La simulation affiche ce qui partirait, pour qui, et une estimation du coût.
 *   - `--limite N` borne le nombre de produits d'un passage.
 *
 * Remplace `enrich-all-products.ts`, qui appelait OpenAI `gpt-4o-mini` avec une clé
 * qui n'existe pas dans ce projet, et réécrivait tags, matières et arguments en bloc.
 *
 * Options :
 *   --appliquer           envoie réellement les requêtes (sinon : simulation, zéro réseau)
 *   --limite N            au plus N produits (défaut : 20)
 *   --modele <id>         défaut : claude-opus-5
 *   --tous                inclut les brouillons (défaut : produits ACTIVE seulement)
 */

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { champsManquants, appliquerEnrichissement, type ProduitAEnrichir } from './champs';
import { MESSAGE_SYSTEME, SchemaEnrichissement, messageUtilisateur, estimerJetons } from './requete';

const prisma = new PrismaClient();

/** Prix par million de jetons (entrée / sortie), pour l'estimation seulement. */
const TARIFS: Record<string, { entree: number; sortie: number }> = {
  'claude-opus-5': { entree: 5, sortie: 25 },
  'claude-sonnet-5': { entree: 2, sortie: 10 },
  'claude-haiku-4-5': { entree: 1, sortie: 5 },
};
const SORTIE_ESTIMEE = 300; // jetons par réponse, ordre de grandeur
const PAUSE_MS = 250;

function lireOptions(argv: string[]) {
  const valeur = (n: string) => { const i = argv.indexOf(n); return i !== -1 ? argv[i + 1] : undefined; };
  const limite = Number.parseInt(valeur('--limite') ?? '', 10);
  return {
    appliquer: argv.includes('--appliquer'),
    limite: Number.isFinite(limite) && limite > 0 ? limite : 20,
    modele: valeur('--modele') ?? 'claude-opus-5',
    tous: argv.includes('--tous'),
  };
}

async function main(): Promise<void> {
  const o = lireOptions(process.argv.slice(2));

  const candidats = await prisma.product.findMany({
    where: o.tous ? {} : { status: 'ACTIVE' },
    select: {
      id: true, name: true, descriptionShort: true, descriptionLong: true,
      tags: true, materials: true, aiSellingPoints: true, seoTitle: true, seoDescription: true,
      attributes: true,
      brand: { select: { name: true, sector: { select: { name: true } } } },
      category: { select: { name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  const aTraiter = candidats
    .map((p) => ({ p, manques: champsManquants(p as ProduitAEnrichir) }))
    .filter((x) => x.manques.length > 0)
    .slice(0, o.limite);

  console.log('\nEnrichissement des fiches produit');
  console.log('─'.repeat(78));
  console.log(`  ${candidats.length} produits examinés, ${aTraiter.length} à enrichir (limite ${o.limite})`);
  console.log(`  Modèle : ${o.modele}${o.appliquer ? '' : ' — SIMULATION, aucun appel réseau'}\n`);

  let jetonsEntree = estimerJetons(MESSAGE_SYSTEME); // le système n'est compté qu'une fois : mis en cache ensuite
  for (const { p, manques } of aTraiter) {
    const message = messageUtilisateur(
      { name: p.name, descriptionShort: p.descriptionShort, descriptionLong: p.descriptionLong,
        marque: p.brand.name, secteur: p.brand.sector?.name ?? null, categorie: p.category?.name ?? null },
      manques,
    );
    jetonsEntree += estimerJetons(message);
    if (!o.appliquer) console.log(`  ${p.brand.name} — ${p.name}\n    manque : ${manques.join(', ')}`);
  }

  const tarif = TARIFS[o.modele];
  const cout = tarif
    ? (jetonsEntree * tarif.entree + aTraiter.length * SORTIE_ESTIMEE * tarif.sortie) / 1_000_000
    : null;
  console.log(`\n  Jetons d'entrée estimés : ~${jetonsEntree}, sortie : ~${aTraiter.length * SORTIE_ESTIMEE}`);
  console.log(`  Coût estimé : ${cout === null ? 'tarif inconnu pour ce modèle' : `~${cout.toFixed(3)} $`} (ordre de grandeur, hors cache)`);

  if (!o.appliquer) {
    console.log('\n  Rien n\'a été envoyé. Relancer avec --appliquer pour lancer les appels.\n');
    return;
  }

  const client = new Anthropic();
  let reussis = 0, vides = 0, echecs = 0;
  const maintenant = new Date().toISOString();

  for (const { p, manques } of aTraiter) {
    const message = messageUtilisateur(
      { name: p.name, descriptionShort: p.descriptionShort, descriptionLong: p.descriptionLong,
        marque: p.brand.name, secteur: p.brand.sector?.name ?? null, categorie: p.category?.name ?? null },
      manques,
    );
    try {
      const reponse = await client.messages.parse({
        model: o.modele,
        max_tokens: 2000,
        system: [{ type: 'text', text: MESSAGE_SYSTEME, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: message }],
        output_config: { format: zodOutputFormat(SchemaEnrichissement) },
      });
      if (reponse.stop_reason === 'refusal' || !reponse.parsed_output) {
        echecs += 1;
        console.log(`  ✗ ${p.name} — ${reponse.stop_reason === 'refusal' ? 'refus' : 'réponse non analysable'}`);
        continue;
      }
      const donnees = appliquerEnrichissement(p as ProduitAEnrichir, reponse.parsed_output);
      const champs = Object.keys(donnees);
      if (champs.length === 0) {
        vides += 1;
        console.log(`  – ${p.name} — le modèle n'a rien pu affirmer`);
        continue;
      }
      const attributs = (p.attributes && typeof p.attributes === 'object' ? p.attributes : {}) as Record<string, unknown>;
      await prisma.product.update({
        where: { id: p.id },
        data: {
          ...donnees,
          attributes: { ...attributs, enrichissement: { modele: o.modele, date: maintenant, champs } } as Prisma.InputJsonValue,
        },
      });
      reussis += 1;
      console.log(`  ✓ ${p.name} — ${champs.join(', ')}  (entrée ${reponse.usage.input_tokens}, cache ${reponse.usage.cache_read_input_tokens ?? 0}, sortie ${reponse.usage.output_tokens})`);
    } catch (e) {
      echecs += 1;
      if (e instanceof Anthropic.RateLimitError) {
        console.log(`  ✗ ${p.name} — limite de débit, pause de 30 s`);
        await new Promise((r) => setTimeout(r, 30_000));
      } else if (e instanceof Anthropic.AuthenticationError) {
        console.error('\n  Clé invalide : arrêt.'); break;
      } else if (e instanceof Anthropic.APIError) {
        console.log(`  ✗ ${p.name} — API ${e.status} : ${e.message}`);
      } else {
        console.log(`  ✗ ${p.name} — ${e instanceof Error ? e.message : e}`);
      }
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }

  console.log(`\n  Enrichis ${reussis} · sans matière ${vides} · échecs ${echecs}\n`);
}

main()
  .catch((e) => { console.error('\nEnrichissement interrompu :', e instanceof Error ? e.message : e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
