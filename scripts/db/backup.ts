#!/usr/bin/env tsx
/**
 * Sauvegarde de la base — `pnpm db:backup` (REBUILD.md T0.2).
 *
 * Le 1er septembre 2026, on a découvert que les 40 000 produits de janvier n'existaient
 * plus nulle part : aucun dump n'avait jamais été fait. Aujourd'hui la base porte à
 * nouveau ce qui ne se rescrape pas — 899 validations de marques, 875 géocodages, les
 * décisions sur les revendications, la piste d'audit. Cette commande produit un dump
 * `pg_dump` compressé, horodaté, dans `~/backups/made-in-france/`, **hors du dépôt**
 * (public) et hors de l'arbre de travail.
 *
 * ⚠️ Un dump sur la même machine protège d'une fausse manœuvre, pas d'un disque mort :
 * le copier ailleurs reste à faire, et la commande le rappelle.
 *
 * Restauration (base vide) :
 *   createdb -O mif_user madeinfrance
 *   pg_restore --no-owner --no-privileges -d "$DATABASE_URL" ~/backups/made-in-france/<fichier>.dump
 *
 * Options :
 *   --dossier <chemin>   autre destination (disque externe, dossier synchronisé)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const i = argv.indexOf('--dossier');
const dossier = i !== -1 && argv[i + 1] ? path.resolve(argv[i + 1]) : path.join(homedir(), 'backups', 'made-in-france');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL absente : lancer depuis la racine, avec --env-file=.env');

// pg_dump de la même version que le serveur (Homebrew), sinon celui du PATH.
const candidats = ['/opt/homebrew/opt/postgresql@16/bin/pg_dump', 'pg_dump'];
const pgDump = candidats.find((c) => c === 'pg_dump' || existsSync(c))!;

// `?schema=public`, `connection_limit`… sont des paramètres Prisma : pg_dump les refuse.
const adresse = new URL(url);
for (const cle of ['schema', 'connection_limit', 'pool_timeout', 'connect_timeout', 'pgbouncer']) adresse.searchParams.delete(cle);
const base = adresse.pathname.replace(/^\//, '');
const horodatage = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
mkdirSync(dossier, { recursive: true });
const fichier = path.join(dossier, `${base}-${horodatage}.dump`);

// Format « custom » : compressé, restaurable table par table avec pg_restore.
// L'URL passe en argument, jamais dans un shell : pas d'interpolation, pas d'historique.
try {
  execFileSync(pgDump, ['--format=custom', '--compress=6', '--no-owner', '--no-privileges', `--file=${fichier}`, adresse.toString()], { stdio: 'inherit' });
} catch {
  // Node répète la commande complète dans son erreur — mot de passe compris. On ne la relaie pas.
  // Et pg_dump laisse un fichier vide derrière lui : on ne garde pas une sauvegarde de 0 octet.
  rmSync(fichier, { force: true });
  console.error('\n  pg_dump a échoué (le message est au-dessus). Aucun fichier conservé.');
  process.exit(1);
}

const taille = statSync(fichier).size;
const precedents = readdirSync(dossier).filter((f) => f.startsWith(`${base}-`) && f.endsWith('.dump')).length;
console.log(`\n  Sauvegarde écrite : ${fichier}`);
console.log(`  Taille : ${(taille / 1_048_576).toFixed(1)} Mo — ${precedents} dump(s) dans ce dossier`);
console.log('\n  ⚠️  Ce fichier est sur cette machine. Le copier ailleurs (disque externe, stockage distant)');
console.log("     est ce qui en fait une sauvegarde. Restauration : voir l'en-tête de scripts/db/backup.ts\n");
