/**
 * Le webhook Stripe, sur une vraie base (REBUILD.md T3.8, T8.5).
 *
 * La signature est produite par l'aide de test du SDK — aucun réseau. Le cas qui
 * compte est le refus : un événement non signé, ou mal signé, ne doit rien changer.
 * L'ancien repli acceptait n'importe quel corps quand le secret manquait.
 */

import Stripe from 'stripe';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { POST as webhook } from '@/app/api/v1/stripe/webhook/route';
import { creerMarque } from './aides';

const SECRET = 'whsec_test_secret_de_test';
const stripe = new Stripe('sk_test_factice', { apiVersion: '2025-12-15.clover' });
const env = { ...process.env };

beforeAll(() => { process.env.STRIPE_SECRET_KEY = 'sk_test_factice'; process.env.STRIPE_WEBHOOK_SECRET = SECRET; });
afterAll(() => { process.env.STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY; process.env.STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET; });

function evenement(type: string, objet: Record<string, unknown>) {
  return JSON.stringify({ id: 'evt_test', object: 'event', type, data: { object: objet }, created: Math.floor(Date.now() / 1000), livemode: false, api_version: '2025-12-15.clover' });
}
function requete(payload: string, signature: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (signature !== null) headers['stripe-signature'] = signature;
  return new Request('http://test.local/api/v1/stripe/webhook', { method: 'POST', headers, body: payload });
}

describe('POST /api/v1/stripe/webhook', () => {
  test('signé : checkout.session.completed active le palier', async () => {
    const m = await creerMarque('payante');
    const payload = evenement('checkout.session.completed', { id: 'cs_1', object: 'checkout.session', subscription: 'sub_1', metadata: { brandId: m.id, plan: 'ROYALE' } });
    const r = await webhook(requete(payload, stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET })));
    expect(r.status).toBe(200);
    const b = await prisma.brand.findUnique({ where: { id: m.id } });
    expect(b!.subscriptionTier).toBe('ROYALE');
    expect(b!.stripeSubscriptionId).toBe('sub_1');
  });

  test('NON signé : 400, et rien ne change — même avec un corps parfait', async () => {
    const m = await creerMarque('convoitee');
    const payload = evenement('checkout.session.completed', { id: 'cs_2', object: 'checkout.session', subscription: 'sub_2', metadata: { brandId: m.id, plan: 'ROYALE' } });
    expect((await webhook(requete(payload, null))).status).toBe(400);
    expect((await webhook(requete(payload, 't=1,v1=deadbeef'))).status).toBe(400);
    const b = await prisma.brand.findUnique({ where: { id: m.id } });
    expect(b!.subscriptionTier).toBe('FREE');
  });

  test('un palier inconnu dans les metadonnees est ignoré', async () => {
    const m = await creerMarque('bidouillee');
    const payload = evenement('checkout.session.completed', { id: 'cs_3', object: 'checkout.session', metadata: { brandId: m.id, plan: 'IMPERIAL' } });
    expect((await webhook(requete(payload, stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET })))).status).toBe(200);
    expect((await prisma.brand.findUnique({ where: { id: m.id } }))!.subscriptionTier).toBe('FREE');
  });

  test('subscription.deleted ramène au palier gratuit', async () => {
    const m = await creerMarque('resiliee');
    await prisma.brand.update({ where: { id: m.id }, data: { subscriptionTier: 'PREMIUM', stripeSubscriptionId: 'sub_9' } });
    const payload = evenement('customer.subscription.deleted', { id: 'sub_9', object: 'subscription', status: 'canceled' });
    await webhook(requete(payload, stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET })));
    const b = await prisma.brand.findUnique({ where: { id: m.id } });
    expect(b!.subscriptionTier).toBe('FREE');
    expect(b!.stripeSubscriptionId).toBeNull();
  });

  test('sans secret configuré : 500, jamais de repli', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const r = await webhook(requete('{}', 'x'));
      expect(r.status).toBe(500);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    }
  });
});
