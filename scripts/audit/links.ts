/**
 * Vérification des liens sortants (REBUILD.md T5.1, socle de T5.2).
 *
 * Un lien d'achat mort coûte plus de confiance qu'un produit absent : l'utilisateur
 * a cliqué, il attendait une page, il obtient une erreur. C'est pourquoi l'état des
 * liens fait partie de l'audit et pas d'un contrôle optionnel.
 *
 * Trois précautions, parce que ce module sort du réseau :
 *   - il n'est lancé que sur demande explicite (`--liens`) ;
 *   - il limite le nombre d'appels simultanés, pour ne pas marteler un hébergeur ;
 *   - il annonce un agent utilisateur identifiable, pour qu'on sache qui frappe.
 */

const AGENT =
  'MadeInFranceBot/1.0 (audit qualite; +https://madeinfrance.fr/a-propos)';

/**
 * Trois états, pas deux.
 *
 * `indetermine` existe parce qu'un 403 ou un 429 ne dit **pas** que la page est morte :
 * il dit qu'un pare-feu a reconnu un robot. Une boutique protégée par Cloudflare répond
 * 403 à l'audit et 200 à un client humain. Les confondre avec les 404 ferait désactiver
 * automatiquement (T5.2) des marques parfaitement vivantes — l'erreur la plus coûteuse
 * que ce module puisse commettre, puisqu'elle retire du contenu sain.
 */
export type Verdict = 'vivant' | 'mort' | 'indetermine';

/** Codes qui signalent un robot repéré, pas une page absente. */
const CODES_ROBOT = new Set([401, 403, 405, 406, 429, 503, 999]);

export function verdictDe(code: number | null): Verdict {
  if (code === null) return 'mort';
  if (code >= 200 && code < 400) return 'vivant';
  if (CODES_ROBOT.has(code)) return 'indetermine';
  return 'mort';
}

export interface EtatLien {
  url: string;
  /** Code HTTP, ou null si la requête n'a pas abouti. */
  code: number | null;
  verdict: Verdict;
  /** Message d'erreur réseau, le cas échéant. */
  erreur?: string;
  /** Durée en millisecondes. */
  duree: number;
}

/**
 * Interroge une URL.
 *
 * `HEAD` d'abord, parce que c'est gratuit pour le serveur d'en face. Beaucoup de
 * boutiques le refusent (405) ou mentent (404 sur HEAD, 200 sur GET) : dans ce cas
 * on retente en `GET`, en coupant dès les premiers octets.
 */
export async function verifierLien(
  url: string,
  delaiMs = 10_000,
): Promise<EtatLien> {
  const debut = Date.now();
  const essayer = async (methode: 'HEAD' | 'GET'): Promise<Response> => {
    const stop = new AbortController();
    const minuteur = setTimeout(() => stop.abort(), delaiMs);
    try {
      return await fetch(url, {
        method: methode,
        redirect: 'follow',
        signal: stop.signal,
        headers: { 'user-agent': AGENT, accept: '*/*' },
      });
    } finally {
      clearTimeout(minuteur);
    }
  };

  try {
    let reponse = await essayer('HEAD');
    if (reponse.status === 405 || reponse.status === 501 || reponse.status >= 400) {
      // Le serveur peut refuser HEAD sans que la page soit morte.
      try {
        const parGet = await essayer('GET');
        await parGet.body?.cancel();
        reponse = parGet;
      } catch {
        /* on garde la réponse du HEAD */
      }
    }
    return {
      url,
      code: reponse.status,
      verdict: verdictDe(reponse.status),
      duree: Date.now() - debut,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      url,
      code: null,
      // Un dépassement de délai n'est pas une preuve de mort : le serveur peut être
      // lent ou nous faire patienter exprès. On ne conclut pas.
      verdict: /abort|timeout/i.test(message) ? 'indetermine' : 'mort',
      erreur: message,
      duree: Date.now() - debut,
    };
  }
}

/**
 * Vérifie une liste d'URL avec un nombre d'appels simultanés borné.
 *
 * Les doublons ne sont interrogés qu'une fois : plusieurs produits d'une même
 * marque partagent souvent le même domaine, et parfois la même page.
 */
export async function verifierLiens(
  urls: string[],
  options: { simultanes?: number; delaiMs?: number; surAvancement?: (faits: number, total: number) => void } = {},
): Promise<Map<string, EtatLien>> {
  const { simultanes = 8, delaiMs = 10_000, surAvancement } = options;
  const uniques = [...new Set(urls)];
  const resultats = new Map<string, EtatLien>();
  let suivant = 0;
  let faits = 0;

  const ouvrier = async (): Promise<void> => {
    while (suivant < uniques.length) {
      const url = uniques[suivant++];
      resultats.set(url, await verifierLien(url, delaiMs));
      faits += 1;
      surAvancement?.(faits, uniques.length);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(simultanes, uniques.length) }, ouvrier),
  );
  return resultats;
}
