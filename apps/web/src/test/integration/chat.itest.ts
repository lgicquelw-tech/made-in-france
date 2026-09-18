/**
 * Le chat, sur une vraie base et un modèle **simulé** (REBUILD.md T3.7).
 *
 * Le modèle est remplacé par un faux client qui rejoue ce que l'API renvoie ; aucun
 * appel réseau, aucun coût. Ce qui est réel : les outils, leurs requêtes, la base.
 * Le scénario central est celui qui cassait : deux appels d'outil dans le même tour.
 */

import type Anthropic from '@anthropic-ai/sdk';
import { beforeEach, describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { repondre } from '@/lib/chat/conversation';

/** Un faux client : renvoie les réponses dans l'ordre, et garde ce qu'on lui a envoyé. */
function fauxClient(reponses: Partial<Anthropic.Message>[]) {
  const appels: Anthropic.MessageCreateParams[] = [];
  let i = 0;
  const client = { messages: { create: async (params: Anthropic.MessageCreateParams) => { appels.push(params); return reponses[i++] as Anthropic.Message; } } };
  return { client: client as unknown as Anthropic, appels };
}
const outil = (id: string, name: string, input: unknown) => ({ type: 'tool_use', id, name, input } as Anthropic.ToolUseBlock);
const texte = (t: string): Anthropic.TextBlock => ({ type: 'text', text: t, citations: null });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "sectors", "regions", "site_settings" CASCADE`;
  const mode = await prisma.sector.create({ data: { name: 'Mode & Accessoires', slug: 'mode-accessoires' } });
  const bretagne = await prisma.region.create({ data: { name: 'Bretagne', slug: 'bretagne' } });
  const m = await prisma.brand.create({ data: { name: 'TRICOTS DE QUIMPER', slug: 'tricots-quimper', status: 'ACTIVE', sectorId: mode.id, regionId: bretagne.id, city: 'Quimper' } });
  await prisma.product.create({ data: { name: 'Pull marin', slug: 'pull-marin', brandId: m.id, status: 'ACTIVE', priceMin: 89, priceMax: 89, imageUrl: 'https://img.example/p.jpg', externalBuyUrl: 'https://tricots.example/pull' } });
  await prisma.product.create({ data: { name: 'Pull sans image', slug: 'pull-sans-image', brandId: m.id, status: 'ACTIVE', priceMin: 50, priceMax: 50 } });
});

describe('repondre', () => {
  test('deux outils dans le meme tour : deux tool_result dans UN message, produits ET marques renvoyes', async () => {
    const { client, appels } = fauxClient([
      { stop_reason: 'tool_use', content: [outil('t1', 'search_products', { query: 'pull' }), outil('t2', 'search_brands', { query: 'pull', sector: 'Mode & Accessoires' })] },
      { stop_reason: 'end_turn', content: [texte('Voici des pulls bretons.\n[SUGGESTIONS]\nPour homme|Pour femme|Moins de 50€|Plus de 100€\n[/SUGGESTIONS]')] },
    ]);
    const r = await repondre('je cherche des pulls', [], client);

    expect(r.message).toContain('pulls bretons');
    expect(r.products.map((p) => p.name)).toEqual(['Pull marin']); // sans image : exclu
    expect(r.products[0].buyUrl).toBe('https://tricots.example/pull');
    expect(r.brands.map((b) => b.name)).toEqual(['TRICOTS DE QUIMPER']);

    // Le second appel au modele porte les deux resultats, dans le meme message utilisateur.
    const dernier = appels[1].messages.at(-1)!;
    expect(dernier.role).toBe('user');
    const blocs = dernier.content as Anthropic.ToolResultBlockParam[];
    expect(blocs.map((b) => b.tool_use_id).sort()).toEqual(['t1', 't2']);
    expect(blocs.every((b) => b.type === 'tool_result')).toBe(true);
  });

  test('une regle a mot-cle repond sans appeler le modele', async () => {
    await prisma.siteSetting.create({ data: { key: 'ai_settings', value: { rules: [{ id: '1', keyword: 'livraison', response: 'Livraison offerte dès 60 €.', enabled: true }] } } });
    const { client, appels } = fauxClient([]);
    const r = await repondre('Quels sont vos frais de LIVRAISON ?', [], client);
    expect(r.message).toBe('Livraison offerte dès 60 €.');
    expect(appels).toHaveLength(0);
  });

  test('l historique est transmis, et la cle ne vient jamais des reglages', async () => {
    await prisma.siteSetting.create({ data: { key: 'ai_settings', value: { model: 'claude-haiku-4-5', temperature: 0.2, apiKey: 'sk-NE-DOIT-PAS-SORTIR' } } });
    const { client, appels } = fauxClient([{ stop_reason: 'end_turn', content: [texte('ok')] }]);
    await repondre('suite', [{ role: 'user', content: 'bonjour' }, { role: 'assistant', content: 'salut' }], client);
    expect(appels[0].messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(appels[0].model).toBe('claude-haiku-4-5');
    expect((appels[0] as { temperature?: number }).temperature).toBe(0.2);
    expect(JSON.stringify(appels[0])).not.toContain('NE-DOIT-PAS-SORTIR');
  });

  test('sur Sonnet 5 / Opus 5, aucune temperature n est envoyee', async () => {
    await prisma.siteSetting.create({ data: { key: 'ai_settings', value: { model: 'claude-opus-5', temperature: 0.9 } } });
    const { client, appels } = fauxClient([{ stop_reason: 'end_turn', content: [texte('ok')] }]);
    await repondre('x', [], client);
    expect('temperature' in appels[0]).toBe(false);
  });

  test('un refus du modele donne une reponse sobre, sans fiche', async () => {
    const { client } = fauxClient([{ stop_reason: 'refusal', content: [] }]);
    const r = await repondre('x', [], client);
    expect(r.products).toEqual([]);
    expect(r.message).toMatch(/ne peux pas/);
  });
});

test('une marque non publique reste invisible pour l assistant', async () => {
  // Le filtre de statut avait été retiré du chat quand une marque sur 903 était ACTIVE.
  // Depuis la validation en bloc du 18 septembre 2026, il dit ce qu'il doit dire.
  await prisma.brand.updateMany({ where: { slug: 'tricots-quimper' }, data: { status: 'SUSPENDED' } });
  const { client } = fauxClient([
    { stop_reason: 'tool_use', content: [outil('t1', 'search_brands', { query: 'pull' })] },
    { stop_reason: 'end_turn', content: [texte('Je ne trouve rien.')] },
  ]);
  const r = await repondre('je cherche des pulls', [], client);
  expect(r.brands).toEqual([]);
});
