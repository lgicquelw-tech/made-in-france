#!/usr/bin/env tsx
/**
 * Géocodage des marques par leur commune — `pnpm data:geocode` (REBUILD.md T5.4).
 *
 * Source : l'API Adresse nationale (`api-adresse.data.gouv.fr`), publique, gratuite,
 * sans clé, qui couvre la métropole et l'outre-mer jusqu'à la Polynésie. Remplace
 * `geocode-api.cjs` (qui prenait le premier résultat sans regarder ni le score ni le
 * type) et `geocode-brands.cjs` (546 lignes de coordonnées de villes en dur).
 *
 * Précision : **le centre de la commune**, pas l'adresse — la base n'a qu'une ville
 * pour 902 marques sur 903. C'est suffisant pour une carte de France, et il faut le
 * savoir avant de zoomer.
 *
 * Les coordonnées existantes ne sont jamais réécrites sans `--forcer`.
 *
 * Options :
 *   --simuler       n'écrit rien
 *   --forcer        réécrit aussi les marques déjà géolocalisées
 *   --echantillon N ne traite que N marques
 *   --suggerer      pour les marques que le géocodage ne place pas, propose la commune
 *                   qu'un lieu-dit ou une ancienne commune désigne — **sans rien écrire**.
 *
 * Pourquoi `--suggerer` ne place jamais : essayé le 18 septembre 2026 sur les 34 marques
 * restantes, ce chemin proposait 12 communes dont **6 fausses** — « Monaco » → Sartène,
 * « Pays Basque » → Mont-de-Marsan, « Île de Ré » → La Rochelle, « France » →
 * Clermont-Dessous. L'API répond alors sur une *rue* qui porte ce nom, ailleurs. Une
 * marque mal placée ne se voit qu'en regardant la carte ; une marque non placée se voit
 * dans ce rapport. Les propositions sont donc un point de départ pour corriger
 * `data/brands.xlsx`, jamais une écriture.
 */

import { PrismaClient } from '@prisma/client';
import { choisirCommune, communeDeRattachement, formesAInterroger, type ResultatBan, type MotifRejet } from './choix-commune';

const prisma = new PrismaClient();
const API = 'https://api-adresse.data.gouv.fr/search/';
const AGENT = 'MadeInFranceBot/1.0 (geocodage; +https://madeinfrance.fr/a-propos)';
/** L'API tolère 50 requêtes par seconde ; on reste très en dessous. */
const PAUSE_MS = 120;

async function interroger(commune: string, communesSeules = true): Promise<ResultatBan[]> {
  const url = `${API}?q=${encodeURIComponent(commune)}${communesSeules ? '&type=municipality' : ''}&limit=5`;
  const reponse = await fetch(url, { headers: { 'user-agent': AGENT } });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  const corps = (await reponse.json()) as {
    features?: { properties: Record<string, unknown>; geometry: { coordinates: [number, number] } }[];
  };
  return (corps.features ?? []).map((f) => ({
    label: String(f.properties.label ?? ''),
    city: f.properties.city ? String(f.properties.city) : null,
    context: String(f.properties.context ?? ''),
    postcode: String(f.properties.postcode ?? ''),
    score: Number(f.properties.score ?? 0),
    type: String(f.properties.type ?? ''),
    longitude: f.geometry.coordinates[0],
    latitude: f.geometry.coordinates[1],
  }));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const simuler = argv.includes('--simuler');
  const forcer = argv.includes('--forcer');
  const suggerer = argv.includes('--suggerer');
  const i = argv.indexOf('--echantillon');
  const echantillon = i !== -1 ? Number.parseInt(argv[i + 1], 10) : Number.MAX_SAFE_INTEGER;

  const marques = await prisma.brand.findMany({
    where: {
      city: { not: null },
      ...(forcer ? {} : { OR: [{ latitude: null }, { longitude: null }] }),
    },
    select: { id: true, name: true, city: true, region: { select: { name: true } } },
    orderBy: { name: 'asc' },
    take: echantillon,
  });

  console.log('\nGéocodage des marques par commune');
  console.log('─'.repeat(78));
  console.log(`  ${marques.length} marques à traiter${simuler ? ' — MODE SIMULATION' : ''}\n`);

  // Une commune revient souvent : on n'interroge l'API qu'une fois par (commune, région).
  const cache = new Map<string, ResultatBan[]>();
  let placees = 0;
  const propositions: { nom: string; ville: string; commune: string }[] = [];
  const rejets = new Map<MotifRejet | 'erreur réseau', { nom: string; ville: string; region: string }[]>();
  const noter = (motif: MotifRejet | 'erreur réseau', m: (typeof marques)[number]) =>
    rejets.set(motif, [...(rejets.get(motif) ?? []), { nom: m.name, ville: m.city!, region: m.region?.name ?? '—' }]);

  for (const [n, m] of marques.entries()) {
    // On tente la valeur entière puis, en repli, la première partie avant `/` ou `(`.
    let resultat: ResultatBan | null = null;
    let motif: MotifRejet | 'erreur réseau' = 'aucun résultat';
    for (const forme of formesAInterroger(m.city!)) {
      const cle = forme.toLowerCase();
      let resultats = cache.get(cle);
      if (!resultats) {
        try {
          resultats = await interroger(forme);
          cache.set(cle, resultats);
          await new Promise((r) => setTimeout(r, PAUSE_MS));
        } catch {
          motif = 'erreur réseau';
          continue;
        }
      }
      const choix = choisirCommune(resultats, m.region?.name ?? null);
      if (choix.resultat) { resultat = choix.resultat; break; }
      motif = choix.motif!;
    }
    // Le nom n'est pas une commune, mais l'API sait sur quelle commune tombe une adresse
    // qui le porte. À vérifier par un humain : une rue « de France » existe partout.
    if (!resultat && suggerer) {
      for (const forme of formesAInterroger(m.city!)) {
        const cle = `lieu:${forme.toLowerCase()}`;
        let resultats = cache.get(cle);
        if (!resultats) {
          try {
            resultats = await interroger(forme, false);
            cache.set(cle, resultats);
            await new Promise((r) => setTimeout(r, PAUSE_MS));
          } catch { continue; }
        }
        const rattache = communeDeRattachement(resultats, m.region?.name ?? null);
        if (rattache) {
          propositions.push({ nom: m.name, ville: m.city!, commune: rattache.city ?? '?' });
          break;
        }
      }
    }

    if (!resultat) {
      noter(motif, m);
      continue;
    }
    if (!simuler) {
      await prisma.brand.update({
        where: { id: m.id },
        data: { latitude: resultat.latitude, longitude: resultat.longitude },
      });
    }
    placees += 1;
    if ((n + 1) % 100 === 0) process.stdout.write(`  ${n + 1}/${marques.length}\n`);
  }

  console.log(`\n  Placées : ${placees} / ${marques.length}`);
  if (propositions.length) {
    console.log(`\n  ${propositions.length} propositions à vérifier — RIEN N'A ÉTÉ ÉCRIT.`);
    console.log('  Une adresse qui porte ce nom se trouve sur cette commune ; ce n\'est pas une preuve.');
    console.log('  Corriger « Ville » dans data/brands.xlsx pour celles qui sont justes :');
    for (const a of propositions) console.log(`    ${a.nom} — « ${a.ville} » → ${a.commune} ?`);
  }
  for (const [motif, liste] of rejets) {
    console.log(`\n  ${motif} : ${liste.length}`);
    for (const r of liste.slice(0, 12)) console.log(`    ${r.nom} — « ${r.ville} » (${r.region})`);
    if (liste.length > 12) console.log(`    … et ${liste.length - 12} autres`);
  }

  if (!simuler) {
    const total = await prisma.brand.count();
    const avec = await prisma.brand.count({ where: { latitude: { not: null }, longitude: { not: null } } });
    console.log(`\n  Marques géolocalisées en base : ${avec} / ${total}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('\nGéocodage interrompu :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
