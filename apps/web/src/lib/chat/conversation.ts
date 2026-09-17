import Anthropic from '@anthropic-ai/sdk';

import { prisma } from '@/lib/db';
import { OUTILS, SECTEURS, chercherMarques, chercherProduits, type MarqueTrouvee, type ProduitTrouve } from './outils';

/**
 * Un tour de conversation avec le personal shopper (REBUILD.md T3.7).
 *
 * Porté depuis Express avec une correction de fond : le prompt exige d'appeler **les
 * deux outils** sur une demande ambiguë, mais la boucle ne traitait que le **premier**
 * `tool_use` de chaque tour. Le second restait sans `tool_result`, et l'API refusait le
 * tour suivant. Chaque appel d'outil d'un même tour reçoit désormais son résultat, dans
 * **un seul** message utilisateur — c'est ce que l'API attend.
 *
 * Les réglages (modèle, prompt, température, règles) viennent de `site_settings` ; la
 * **clé** ne vient que de l'environnement (règle 4).
 */

export const MODELE_PAR_DEFAUT = 'claude-haiku-4-5';
const TOURS_MAX = 4;

export const PROMPT_PAR_DEFAUT = `Tu es un personal shopper Made in France.

À CHAQUE MESSAGE, appelle au moins un outil :
- l'utilisateur cherche un PRODUIT, un cadeau, un budget → search_products
- il cherche des MARQUES, des fabricants, des artisans, une région → search_brands
- c'est ambigu → les deux, dans le même tour

Secteurs disponibles : ${SECTEURS.join(', ')}.

Puis : présente les résultats en une ou deux phrases, pose UNE question pour affiner, et
termine par quatre critères d'affinage — jamais des noms de produits ni de marques :
[SUGGESTIONS]
critère1|critère2|critère3|critère4
[/SUGGESTIONS]

Tutoiement, phrases courtes, un emoji au plus. N'invente jamais un produit, une marque,
une matière ou un prix : tu ne connais que ce que les outils renvoient.`;

export interface ReglagesIA {
  model?: string; prompt?: string; temperature?: number; maxTokens?: number;
  rules?: { keyword: string; response: string; enabled: boolean }[];
}

export async function lireReglages(): Promise<ReglagesIA> {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { key: 'ai_settings' } });
    return (s?.value as ReglagesIA) ?? {};
  } catch {
    return {};
  }
}

export interface MessageHistorique { role: 'user' | 'assistant'; content: string }

export interface ReponseChat {
  message: string;
  products: ReturnType<typeof formaterProduit>[];
  brands: ReturnType<typeof formaterMarque>[];
}

const formaterProduit = (p: ProduitTrouve) => ({
  id: p.id, name: p.name, slug: p.slug, description: p.description_short, imageUrl: p.image_url,
  priceMin: p.price_min, priceMax: p.price_max, buyUrl: p.external_buy_url,
  brandName: p.brand_name, brandSlug: p.brand_slug, brandCity: p.brand_city, sectorName: p.sector_name, sectorColor: p.sector_color,
});
const formaterMarque = (b: MarqueTrouvee) => ({
  id: b.id, name: b.name, slug: b.slug, description: b.description_short, logoUrl: b.logo_url, websiteUrl: b.website_url,
  city: b.city, yearFounded: b.year_founded, sectorName: b.sector_name, sectorColor: b.sector_color, regionName: b.region_name,
  productCount: Number(b.product_count) || 0,
});

/** Exécute un appel d'outil et renvoie le résultat texte pour le modèle, plus les fiches. */
async function executerOutil(bloc: Anthropic.ToolUseBlock): Promise<{ texte: string; produits: ProduitTrouve[]; marques: MarqueTrouvee[] }> {
  const input = (bloc.input ?? {}) as Record<string, unknown>;
  if (bloc.name === 'search_products') {
    const produits = await chercherProduits(input as never);
    return {
      texte: produits.length ? `${produits.length} produits : ${produits.map((p) => `${p.name} (${p.brand_name}) — ${p.price_min} €`).join(', ')}` : 'Aucun produit trouvé.',
      produits, marques: [],
    };
  }
  if (bloc.name === 'search_brands') {
    const marques = await chercherMarques(input as never);
    return {
      texte: marques.length ? `${marques.length} marques : ${marques.map((b) => `${b.name} (${b.sector_name ?? '?'}, ${b.region_name ?? '?'})`).join(', ')}` : 'Aucune marque trouvée.',
      produits: [], marques,
    };
  }
  return { texte: 'Outil inconnu.', produits: [], marques: [] };
}

export async function repondre(message: string, historique: MessageHistorique[], client: Anthropic = new Anthropic()): Promise<ReponseChat> {
  const r = await lireReglages();

  // Règles à mot-clé : une réponse fixe, sans appel au modèle.
  const bas = message.toLowerCase();
  for (const regle of r.rules ?? []) {
    if (regle.enabled && regle.keyword && bas.includes(regle.keyword.toLowerCase())) {
      return { message: regle.response, products: [], brands: [] };
    }
  }

  const model = r.model?.trim() || process.env.ANTHROPIC_MODEL || MODELE_PAR_DEFAUT;
  const system = r.prompt?.trim() || PROMPT_PAR_DEFAUT;
  const max_tokens = r.maxTokens ?? 1024;
  // La température n'existe plus sur Sonnet 5 et Opus 5 (400 si envoyée) ; Haiku 4.5 l'accepte.
  const temperature = model.startsWith('claude-haiku') ? (r.temperature ?? 0.7) : undefined;

  const messages: Anthropic.MessageParam[] = [
    ...historique.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];
  const produits: ProduitTrouve[] = [];
  const marques: MarqueTrouvee[] = [];

  let reponse = await client.messages.create({ model, max_tokens, system, tools: OUTILS, messages, ...(temperature !== undefined ? { temperature } : {}) });

  for (let tour = 0; reponse.stop_reason === 'tool_use' && tour < TOURS_MAX; tour++) {
    const appels = reponse.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    // Tous les résultats du tour dans UN message : c'est la forme attendue par l'API,
    // et c'est ce qui manquait.
    const resultats: Anthropic.ToolResultBlockParam[] = [];
    for (const appel of appels) {
      const res = await executerOutil(appel);
      produits.push(...res.produits); marques.push(...res.marques);
      resultats.push({ type: 'tool_result', tool_use_id: appel.id, content: res.texte });
    }
    messages.push({ role: 'assistant', content: reponse.content });
    messages.push({ role: 'user', content: resultats });
    reponse = await client.messages.create({ model, max_tokens, system, tools: OUTILS, messages, ...(temperature !== undefined ? { temperature } : {}) });
  }

  if (reponse.stop_reason === 'refusal') {
    return { message: 'Je ne peux pas répondre à cette demande.', products: [], brands: [] };
  }
  const texte = reponse.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? "Je n'ai pas pu formuler de réponse.";
  return { message: texte, products: produits.map(formaterProduit), brands: marques.map(formaterMarque) };
}
