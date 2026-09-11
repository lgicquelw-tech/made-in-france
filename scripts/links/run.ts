#!/usr/bin/env tsx
/**
 * Vérificateur de liens sortants — `pnpm data:links` (REBUILD.md T5.2).
 *
 * Interroge les sites de marque et les liens d'achat, garde la mémoire de chaque URL
 * dans `link_checks`, et désactive ceux qui échouent durablement.
 *
 * La règle de décision est dans `policy.ts`, volontairement séparée : c'est la partie
 * où une erreur retire du contenu vivant, donc la partie qu'on veut pouvoir relire et
 * tester seule (`pnpm test:links`).
 *
 * Désactiver **n'efface jamais l'URL.** On pose une date dans `websiteDeadAt` /
 * `buyUrlDeadAt` ; l'affichage cesse, la donnée reste. Un lien qui redevient vivant est
 * réactivé tout seul au passage suivant.
 *
 * Options :
 *   --simuler           n'écrit rien : annonce ce qui serait fait
 *   --usage <quoi>      `marques`, `produits` ou `tout` (défaut : tout)
 *   --echantillon N     ne traite que N liens de chaque type
 *   --simultanes N      appels réseau en parallèle (défaut : 8)
 *   --delai N           délai d'attente par lien, en secondes (défaut : 15)
 */

import { PrismaClient } from '@prisma/client';
import { urlPlausible, lienAchat, type FicheProduit } from '../audit/checks';
import { verifierLiens, type Verdict } from '../audit/links';
import { decider, ECHECS_REQUIS, ANCIENNETE_REQUISE_MS, type EtatSuivi } from './policy';

const prisma = new PrismaClient();

const USAGE_MARQUE = 'brand_website';
const USAGE_PRODUIT = 'product_buy';

interface Cible {
  url: string;
  usage: typeof USAGE_MARQUE | typeof USAGE_PRODUIT;
}

function lireOptions(argv: string[]) {
  const valeur = (n: string) => {
    const i = argv.indexOf(n);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const entier = (n: string, d: number) => {
    const v = Number.parseInt(valeur(n) ?? '', 10);
    return Number.isFinite(v) && v > 0 ? v : d;
  };
  const usage = valeur('--usage') ?? 'tout';
  return {
    simuler: argv.includes('--simuler'),
    marques: usage === 'tout' || usage === 'marques',
    produits: usage === 'tout' || usage === 'produits',
    echantillon: entier('--echantillon', Number.MAX_SAFE_INTEGER),
    simultanes: entier('--simultanes', 8),
    delaiMs: entier('--delai', 15) * 1000,
  };
}

/** Rassemble les URL à interroger, sans doublon, en gardant leur usage. */
async function rassembler(options: ReturnType<typeof lireOptions>): Promise<Cible[]> {
  const cibles: Cible[] = [];

  if (options.marques) {
    const marques = await prisma.brand.findMany({ select: { websiteUrl: true } });
    for (const m of marques) {
      if (urlPlausible(m.websiteUrl)) {
        cibles.push({ url: m.websiteUrl!.trim(), usage: USAGE_MARQUE });
      }
    }
  }

  if (options.produits) {
    const produits = await prisma.product.findMany({
      select: { externalBuyUrl: true, affiliateUrl: true },
    });
    for (const p of produits) {
      const url = lienAchat(p as unknown as FicheProduit);
      if (url) cibles.push({ url, usage: USAGE_PRODUIT });
    }
  }

  const vues = new Set<string>();
  const uniques = cibles.filter((c) => !vues.has(c.url) && vues.add(c.url));
  const parUsage = (u: string) =>
    uniques.filter((c) => c.usage === u).slice(0, options.echantillon);
  return [...parUsage(USAGE_MARQUE), ...parUsage(USAGE_PRODUIT)];
}

/** Applique la conséquence d'une décision aux fiches qui portent l'URL. */
async function appliquer(
  cible: Cible,
  action: 'desactiver' | 'reactiver',
  quand: Date,
): Promise<number> {
  const date = action === 'desactiver' ? quand : null;
  if (cible.usage === USAGE_MARQUE) {
    const r = await prisma.brand.updateMany({
      where: { websiteUrl: cible.url },
      data: { websiteDeadAt: date },
    });
    return r.count;
  }
  const r = await prisma.product.updateMany({
    where: { OR: [{ affiliateUrl: cible.url }, { externalBuyUrl: cible.url }] },
    data: { buyUrlDeadAt: date },
  });
  return r.count;
}

async function main(): Promise<void> {
  const options = lireOptions(process.argv.slice(2));
  const maintenant = new Date();

  const cibles = await rassembler(options);
  const nbMarques = cibles.filter((c) => c.usage === USAGE_MARQUE).length;
  const nbProduits = cibles.length - nbMarques;

  console.log('\nVérificateur de liens sortants');
  console.log('─'.repeat(78));
  console.log(`  ${nbMarques} sites de marque, ${nbProduits} liens d'achat`);
  console.log(
    `  Règle : ${ECHECS_REQUIS} échecs consécutifs ET premier échec vieux de ` +
      `${Math.floor(ANCIENNETE_REQUISE_MS / 3_600_000)} h.`,
  );
  if (options.simuler) console.log('  MODE SIMULATION — rien ne sera écrit.');
  console.log('');

  const etats = await verifierLiens(
    cibles.map((c) => c.url),
    {
      simultanes: options.simultanes,
      delaiMs: options.delaiMs,
      surAvancement: (faits, total) => {
        if (faits === total || faits % 50 === 0) {
          process.stdout.write(`\r  interrogation : ${faits}/${total}   `);
        }
      },
    },
  );
  process.stdout.write('\n');

  const compte: Record<Verdict, number> = { vivant: 0, mort: 0, indetermine: 0 };
  const desactives: string[] = [];
  const reactives: string[] = [];
  let fichesTouchees = 0;
  let enAttente = 0;

  for (const cible of cibles) {
    const mesure = etats.get(cible.url);
    if (!mesure) continue;
    compte[mesure.verdict] += 1;

    const connu = await prisma.linkCheck.findUnique({ where: { url: cible.url } });
    const avant: EtatSuivi = connu
      ? {
          consecutiveFailures: connu.consecutiveFailures,
          firstFailedAt: connu.firstFailedAt,
          disabledAt: connu.disabledAt,
        }
      : { consecutiveFailures: 0, firstFailedAt: null, disabledAt: null };

    const decision = decider(avant, mesure.verdict, maintenant);
    if (
      mesure.verdict === 'mort' &&
      decision.action === 'rien' &&
      decision.etat.disabledAt === null
    ) {
      enAttente += 1;
    }

    if (!options.simuler) {
      const donnees = {
        usage: cible.usage,
        lastStatus: mesure.code,
        lastVerdict: mesure.verdict,
        consecutiveFailures: decision.etat.consecutiveFailures,
        firstFailedAt: decision.etat.firstFailedAt,
        disabledAt: decision.etat.disabledAt,
        lastCheckedAt: maintenant,
      };
      await prisma.linkCheck.upsert({
        where: { url: cible.url },
        create: { url: cible.url, ...donnees },
        update: donnees,
      });
    }

    if (decision.action !== 'rien') {
      const n = options.simuler
        ? 0
        : await appliquer(cible, decision.action, maintenant);
      fichesTouchees += n;
      const ligne = `${cible.url} — ${decision.motif}`;
      (decision.action === 'desactiver' ? desactives : reactives).push(ligne);
    }
  }

  console.log(
    `\n  Vivants ${compte.vivant} · morts ${compte.mort} · indéterminés ${compte.indetermine}`,
  );
  console.log(`  Morts en attente du seuil : ${enAttente}`);

  for (const [titre, liste] of [
    ['Désactivés', desactives],
    ['Réactivés', reactives],
  ] as const) {
    console.log(`\n  ${titre} : ${liste.length}`);
    for (const l of liste.slice(0, 20)) console.log(`    ${l}`);
    if (liste.length > 20) console.log(`    … et ${liste.length - 20} autres`);
  }

  console.log(
    options.simuler
      ? '\n  Simulation : aucune fiche modifiée.'
      : `\n  Fiches modifiées : ${fichesTouchees}`,
  );
  console.log(
    '\n  Rappel : l\'URL n\'est jamais effacée. Un lien qui répond de nouveau est\n' +
      '  réactivé automatiquement au passage suivant.\n',
  );
}

main()
  .catch((e) => {
    console.error('\nVérification interrompue :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
