#!/usr/bin/env tsx
/**
 * Audit de qualité des données — `pnpm data:audit` (REBUILD.md T5.1).
 *
 * Répond à une seule question : **combien de fiches sont réellement affichables ?**
 * « 903 marques » est un chiffre de communication ; « N publiables, M à compléter »
 * est un plan de travail.
 *
 * Lecture seule. Ce script ne modifie jamais la base — il mesure. Les corrections
 * sont le rôle de T5.2 (liens morts) et T5.8 (publication au seuil).
 *
 * Options :
 *   --liens             interroge le réseau : sites de marque et liens d'achat
 *   --echantillon N     n'interroge que N liens de chaque type (défaut : tous)
 *   --simultanes N      appels réseau en parallèle (défaut : 8)
 *   --delai N           délai d'attente par lien, en secondes (défaut : 10)
 *   --json <fichier>    écrit le bilan complet en JSON, pour comparer deux passages
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import {
  CONTROLES_MARQUE,
  CONTROLES_PRODUIT,
  lienAchat,
  urlPlausible,
  type FicheMarque,
  type FicheProduit,
} from './checks';
import { verifierLiens, type EtatLien } from './links';
import { detecterBruit, dedoublonner } from '../catalogue/noise';
import { evaluer, afficherBilan, afficherRepartition } from './report';

const prisma = new PrismaClient();

// ------------------------------------------------------------------ options

function lireOptions(argv: string[]) {
  const valeur = (nom: string): string | undefined => {
    const i = argv.indexOf(nom);
    return i !== -1 ? argv[i + 1] : undefined;
  };
  const entier = (nom: string, defaut: number): number => {
    const v = valeur(nom);
    const n = v === undefined ? NaN : Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : defaut;
  };
  return {
    liens: argv.includes('--liens'),
    echantillon: entier('--echantillon', Number.MAX_SAFE_INTEGER),
    simultanes: entier('--simultanes', 8),
    delaiMs: entier('--delai', 10) * 1000,
    json: valeur('--json'),
  };
}

// ------------------------------------------------------------------ mesures

/** Compte les noms apparaissant plus d'une fois, à la casse et aux espaces près. */
function doublonsDeNom(noms: string[]): Map<string, number> {
  const compte = new Map<string, number>();
  for (const nom of noms) {
    const cle = nom.trim().toLowerCase().replace(/\s+/g, ' ');
    compte.set(cle, (compte.get(cle) ?? 0) + 1);
  }
  return new Map([...compte].filter(([, n]) => n > 1));
}

function bilanLiens(etats: Map<string, EtatLien>) {
  let vivants = 0;
  let morts = 0;
  let indetermines = 0;
  const parCode = new Map<string, number>();
  for (const e of etats.values()) {
    if (e.verdict === 'vivant') vivants += 1;
    else if (e.verdict === 'mort') morts += 1;
    else indetermines += 1;
    const cle =
      e.code === null
        ? `réseau : ${(e.erreur ?? 'échec').slice(0, 40)}`
        : `HTTP ${e.code} (${e.verdict})`;
    parCode.set(cle, (parCode.get(cle) ?? 0) + 1);
  }
  return { total: etats.size, vivants, morts, indetermines, parCode };
}

/** Les URL d'un verdict donné, pour que T5.2 puisse agir sans refaire le travail. */
function urlsDeVerdict(etats: Map<string, EtatLien>, verdict: string): string[] {
  return [...etats.values()].filter((e) => e.verdict === verdict).map((e) => e.url);
}

function echantillonner<T>(liste: T[], taille: number): T[] {
  return taille >= liste.length ? liste : liste.slice(0, taille);
}

// ------------------------------------------------------------------ exécution

async function main(): Promise<void> {
  const options = lireOptions(process.argv.slice(2));

  const marques = await prisma.brand.findMany({
    select: {
      id: true, name: true, slug: true, status: true,
      descriptionShort: true, descriptionLong: true,
      sectorId: true, regionId: true, websiteUrl: true,
      logoUrl: true, coverImageUrl: true, galleryUrls: true,
      city: true, latitude: true, longitude: true, yearFounded: true,
      socialLinks: true,
    },
  });

  const produits = await prisma.product.findMany({
    select: {
      id: true, name: true, slug: true, status: true, brandId: true,
      descriptionShort: true, imageUrl: true, galleryUrls: true,
      priceMin: true, externalBuyUrl: true, affiliateUrl: true,
      categoryId: true, materials: true, madeInFranceLevel: true,
      externalSource: true, tags: true,
    },
  });

  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║  Audit de qualité des données — lecture seule                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');

  const bilanMarques = evaluer(marques as unknown as FicheMarque[], CONTROLES_MARQUE);
  afficherBilan('MARQUES', bilanMarques);

  const bilanProduits = evaluer(produits as unknown as FicheProduit[], CONTROLES_PRODUIT);
  afficherBilan('PRODUITS', bilanProduits);

  // --- statuts, et l'écart entre « publiable » et « publié »
  const parStatutMarque = new Map<string, number>();
  for (const m of marques) parStatutMarque.set(m.status, (parStatutMarque.get(m.status) ?? 0) + 1);
  afficherRepartition('Marques par statut', parStatutMarque);

  const publiablesNonPubliees = marques.filter(
    (m) =>
      m.status !== 'ACTIVE' &&
      CONTROLES_MARQUE.filter((c) => c.severite === 'BLOQUANT').every((c) =>
        c.ok(m as unknown as FicheMarque),
      ),
  ).length;
  const publieesNonPubliables = marques.filter(
    (m) =>
      m.status === 'ACTIVE' &&
      !CONTROLES_MARQUE.filter((c) => c.severite === 'BLOQUANT').every((c) =>
        c.ok(m as unknown as FicheMarque),
      ),
  ).length;

  console.log('\nÉcart entre ce qui est publiable et ce qui est publié');
  console.log('─'.repeat(78));
  console.log(`  Publiables mais pas au statut ACTIVE : ${publiablesNonPubliees}`);
  console.log(`  Au statut ACTIVE mais pas publiables : ${publieesNonPubliables}`);
  if (publieesNonPubliables > 0) {
    console.log('  ⚠️  Ces fiches sont en ligne alors qu\'il leur manque un élément bloquant.');
  }

  const parStatutProduit = new Map<string, number>();
  for (const p of produits) parStatutProduit.set(p.status, (parStatutProduit.get(p.status) ?? 0) + 1);
  afficherRepartition('Produits par statut', parStatutProduit);

  const parSource = new Map<string, number>();
  for (const p of produits) parSource.set(p.externalSource ?? 'inconnue (manuel ?)', (parSource.get(p.externalSource ?? 'inconnue (manuel ?)') ?? 0) + 1);
  afficherRepartition('Produits par provenance (T5.6)', parSource);

  // --- bruit et doublons de produits (T5.3)
  const bruit = new Map<string, number>();
  for (const p of produits) {
    const raison = detecterBruit({
      name: p.name,
      tags: Array.isArray(p.tags) ? (p.tags as unknown[]).map(String) : [],
    });
    if (raison) bruit.set(raison, (bruit.get(raison) ?? 0) + 1);
  }
  const parMarque = new Map<string, typeof produits>();
  for (const p of produits) {
    parMarque.set(p.brandId, [...(parMarque.get(p.brandId) ?? []), p]);
  }
  let doublonsProduits = 0;
  for (const lot of parMarque.values()) doublonsProduits += dedoublonner(lot).doublons.length;
  const totalBruit = [...bruit.values()].reduce((a, b) => a + b, 0);
  afficherRepartition(
    `Produits qui seraient écartés comme bruit — ${totalBruit} (T5.3)`,
    bruit,
  );
  console.log(`  Doublons de nom au sein d'une même marque : ${doublonsProduits}`);

  // --- doublons de marques
  const dm = doublonsDeNom(marques.map((m) => m.name));
  afficherRepartition(
    `Noms de marque en double — ${dm.size} nom(s) concerné(s)`,
    dm,
  );

  // --- liens
  let liensMarques: ReturnType<typeof bilanLiens> | null = null;
  let liensProduits: ReturnType<typeof bilanLiens> | null = null;
  let mortsSites: string[] = [];
  let mortsAchats: string[] = [];
  let douteusesSites: string[] = [];

  if (options.liens) {
    const sites = echantillonner(
      marques.map((m) => m.websiteUrl).filter((u): u is string => urlPlausible(u)),
      options.echantillon,
    );
    const achats = echantillonner(
      produits
        .map((p) => lienAchat(p as unknown as FicheProduit))
        .filter((u): u is string => u !== null),
      options.echantillon,
    );

    console.log(`\nVérification réseau — ${sites.length} sites, ${achats.length} liens d'achat`);
    console.log('─'.repeat(78));

    const avancement = (quoi: string) => (faits: number, total: number) => {
      if (faits === total || faits % 50 === 0) {
        process.stdout.write(`\r  ${quoi} : ${faits}/${total}   `);
      }
    };

    const etatsSites = await verifierLiens(sites, {
      simultanes: options.simultanes,
      delaiMs: options.delaiMs,
      surAvancement: avancement('sites de marque'),
    });
    process.stdout.write('\n');
    const etatsAchats = await verifierLiens(achats, {
      simultanes: options.simultanes,
      delaiMs: options.delaiMs,
      surAvancement: avancement("liens d'achat"),
    });
    if (achats.length > 0) process.stdout.write('\n');

    liensMarques = bilanLiens(etatsSites);
    liensProduits = bilanLiens(etatsAchats);

    const resume = (b: ReturnType<typeof bilanLiens>) =>
      `${b.vivants} vivants, ${b.morts} morts, ${b.indetermines} indéterminés ` +
      `(sur ${b.total} URL uniques)`;

    console.log(`\n  Sites de marque   : ${resume(liensMarques)}`);
    afficherRepartition('  Codes de réponse — sites de marque', liensMarques.parCode, 10);
    if (liensProduits.total > 0) {
      console.log(`\n  Liens d'achat     : ${resume(liensProduits)}`);
      afficherRepartition("  Codes de réponse — liens d'achat", liensProduits.parCode, 10);
    }
    console.log(
      "\n  « Indéterminé » = 403, 429, délai dépassé… : un pare-feu a reconnu un robot,\n" +
        '  pas une page absente. T5.2 ne doit désactiver que les « morts ».',
    );

    mortsSites = urlsDeVerdict(etatsSites, 'mort');
    mortsAchats = urlsDeVerdict(etatsAchats, 'mort');
    douteusesSites = urlsDeVerdict(etatsSites, 'indetermine');
    for (const [quoi, liste] of [["Sites de marque", mortsSites], ["Liens d'achat", mortsAchats]] as const) {
      if (liste.length > 0) {
        console.log(`\n  ${quoi} morts (${liste.length}) :`);
        for (const u of liste.slice(0, 15)) console.log(`    ${u}`);
        if (liste.length > 15) console.log(`    … et ${liste.length - 15} autres`);
      }
    }
  } else {
    console.log('\nLiens sortants : non vérifiés. Relancer avec --liens pour les interroger.');
  }

  if (options.json) {
    const sortie = {
      genereLe: new Date().toISOString(),
      marques: bilanMarques,
      produits: bilanProduits,
      ecartPublication: { publiablesNonPubliees, publieesNonPubliables },
      doublonsDeNom: Object.fromEntries(dm),
      bruitProduits: { total: totalBruit, parRaison: Object.fromEntries(bruit), doublons: doublonsProduits },
      liens: {
        marques: liensMarques && { ...liensMarques, parCode: Object.fromEntries(liensMarques.parCode) },
        produits: liensProduits && { ...liensProduits, parCode: Object.fromEntries(liensProduits.parCode) },
        // Listes exploitables telles quelles par T5.2.
        urlsMortes: { sites: mortsSites, achats: mortsAchats },
        urlsIndeterminees: { sites: douteusesSites },
      },
    };
    fs.writeFileSync(options.json, JSON.stringify(sortie, null, 2), 'utf-8');
    console.log(`\nBilan complet écrit dans ${options.json}`);
  }

  console.log('');
}

main()
  .catch((e) => {
    console.error('\nAudit interrompu :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
