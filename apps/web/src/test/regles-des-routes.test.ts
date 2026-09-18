/**
 * Les règles non négociables de `CLAUDE.md`, vérifiées sur le code source à chaque
 * passage — pas relues par un humain une fois par mois.
 *
 * Le projet a eu huit failles critiques parce que des routes partaient sans garde, sans
 * validation, ou concaténaient la saisie dans du SQL. Chacune a été fermée à la main ; ce
 * test empêche qu'une nouvelle route rouvre l'une d'elles sans que la CI le dise.
 *
 * Analyse statique du texte des fichiers : simple, lisible, et une fausse alerte se
 * corrige en ajoutant une **exception nommée et justifiée** ci-dessous — jamais en
 * affaiblissant la règle.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const RACINE = path.resolve(__dirname, '../app/api');

function routes(dossier = RACINE): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = path.join(dossier, nom);
    if (statSync(chemin).isDirectory()) return routes(chemin);
    return nom === 'route.ts' ? [chemin] : [];
  });
}

const FICHIERS = routes();
const relatif = (f: string) => path.relative(RACINE, f).replace(/\\/g, '/');
const source = (f: string) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ''); // sans les commentaires

/** Méthodes exportées : `export const POST = route(` ou `export async function POST(`. */
function methodes(code: string): string[] {
  return [...code.matchAll(/export\s+(?:const|async function|function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => m[1]);
}

const ECRITURES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const AVEC_CORPS = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Routes qui écrivent SANS garde de session, chacune avec sa raison et ce qui la remplace.
 * Ajouter ici, c'est s'engager sur la ligne « parce que ».
 */
const ECRITURES_SANS_SESSION: Record<string, { parceQue: string; doitContenir: string }> = {
  'auth/register/route.ts': { parceQue: "créer un compte se fait sans compte ; le limiteur de débit tient lieu de garde", doitContenir: 'enforceRateLimit(' },
  'v1/chat/route.ts': { parceQue: "l'assistant est public ; le limiteur borne la dépense", doitContenir: 'enforceRateLimit(' },
  'v1/stripe/webhook/route.ts': { parceQue: "Stripe n'a pas de session ; la signature est la garde, et un webhook non vérifiable échoue", doitContenir: 'constructEvent(' },
  'auth/[...nextauth]/route.ts': { parceQue: 'NextAuth lui-même', doitContenir: 'NextAuth(' },
};

/** Écritures sans corps à valider : la cible est dans l'URL, l'action est fixe. */
const SANS_CORPS: Record<string, string> = {
  'admin/products/[id]/toggle-featured/route.ts': 'bascule un booléen, aucune donnée transmise',
  'admin/products/activate-all/route.ts': 'action de masse sans paramètre, réservée au super-administrateur',
  'v1/stripe/webhook/route.ts': "corps brut vérifié par signature — le parser avant casserait la signature",
  'auth/[...nextauth]/route.ts': 'NextAuth lui-même',
};

describe('règles des routes d’API', () => {
  test('il y a bien des routes à vérifier', () => {
    expect(FICHIERS.length).toBeGreaterThan(50);
  });

  test("chaque route.ts porte `dynamic = 'force-dynamic'` — sinon un GET est figé au build", () => {
    const sans = FICHIERS.filter((f) => !/export\s+const\s+dynamic\s*=\s*'force-dynamic'/.test(source(f)));
    expect(sans.map(relatif)).toEqual([]);
  });

  test('toute route sous api/admin/** exige un rôle administrateur, quelle que soit la méthode', () => {
    const fautives = FICHIERS.filter((f) => relatif(f).startsWith('admin/') && !/require(Admin|SuperAdmin)\(/.test(source(f)));
    expect(fautives.map(relatif)).toEqual([]);
  });

  test('api/upload exige un administrateur', () => {
    const f = FICHIERS.find((x) => relatif(x) === 'upload/route.ts');
    expect(f && /requireAdmin\(/.test(source(f))).toBe(true);
  });

  test('toute écriture sous api/v1/brands/[slug]/** exige la propriété de la marque', () => {
    const fautives = FICHIERS.filter((f) => {
      const r = relatif(f);
      if (!r.startsWith('v1/brands/[slug]/')) return false;
      const code = source(f);
      return methodes(code).some((m) => ECRITURES.has(m)) && !/requireBrandOwner\(/.test(code);
    });
    expect(fautives.map(relatif)).toEqual([]);
  });

  test('toute route sous api/v1/me/** exige une session — l’identité ne vient jamais du client', () => {
    const fautives = FICHIERS.filter((f) => relatif(f).startsWith('v1/me/') && !/requireUser\(/.test(source(f)));
    expect(fautives.map(relatif)).toEqual([]);
  });

  test('aucune écriture ne part sans garde de session, hors exceptions nommées', () => {
    const fautives: string[] = [];
    for (const f of FICHIERS) {
      const r = relatif(f);
      const code = source(f);
      if (!methodes(code).some((m) => ECRITURES.has(m))) continue;
      const gardee = /require(Admin|SuperAdmin|BrandOwner|User)\(/.test(code);
      const exception = ECRITURES_SANS_SESSION[r];
      if (gardee) continue;
      if (exception) {
        if (!code.includes(exception.doitContenir)) fautives.push(`${r} : exception « ${exception.parceQue} » mais ${exception.doitContenir} absent`);
        continue;
      }
      fautives.push(r);
    }
    expect(fautives).toEqual([]);
  });

  test('toute route qui lit un corps le valide avec Zod (`.parse` ou `safeParse`)', () => {
    const fautives = FICHIERS.filter((f) => {
      const r = relatif(f);
      if (SANS_CORPS[r]) return false;
      const code = source(f);
      return methodes(code).some((m) => AVEC_CORPS.has(m)) && !/\.(safeParse|parse)\(/.test(code);
    });
    expect(fautives.map(relatif)).toEqual([]);
  });

  test('les exceptions déclarées existent encore — une exception orpheline est un mensonge', () => {
    const existants = new Set(FICHIERS.map(relatif));
    for (const r of [...Object.keys(ECRITURES_SANS_SESSION), ...Object.keys(SANS_CORPS)]) {
      expect(existants.has(r), r).toBe(true);
    }
  });
});

describe('règles du code serveur', () => {
  const tousLesTs = (dossier: string): string[] =>
    readdirSync(dossier).flatMap((nom) => {
      const chemin = path.join(dossier, nom);
      if (statSync(chemin).isDirectory()) return nom === 'node_modules' ? [] : tousLesTs(chemin);
      return /\.tsx?$/.test(nom) && !/\.(test|itest)\.tsx?$/.test(nom) ? [chemin] : [];
    });
  const SRC = path.resolve(__dirname, '..');
  const fichiers = tousLesTs(SRC);

  test('jamais de `$queryRawUnsafe` ni de `$executeRawUnsafe`', () => {
    const fautifs = fichiers.filter((f) => /\$(query|execute)RawUnsafe/.test(source(f)));
    expect(fautifs.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  test('un seul `new PrismaClient` : lib/db.ts', () => {
    const fautifs = fichiers.filter((f) => /new PrismaClient\(/.test(source(f)));
    expect(fautifs.map((f) => path.relative(SRC, f))).toEqual(['lib/db.ts']);
  });

  test('aucune URL d’API absolue vers un port local : tout appel est relatif', () => {
    const fautifs = fichiers.filter((f) => /localhost:(4000|3001)|NEXT_PUBLIC_API_URL/.test(source(f)));
    expect(fautifs.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
