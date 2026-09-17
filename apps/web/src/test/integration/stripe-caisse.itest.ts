/**
 * La caisse et le portail Stripe, sur une vraie base (REBUILD.md T8.5, T8.6).
 *
 * Stripe est remplacé par un double qui enregistre ce qu'on lui demande : ce qu'on
 * vérifie, c'est ce qui **part** vers Stripe — le prix vient de la table
 * `subscription_plans`, l'e-mail de la session, le client est créé une fois — et tout
 * ce qui doit être refusé **avant** qu'un seul appel ne parte.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { prisma } from '@/lib/db';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

const appels = { clients: [] as unknown[], sessions: [] as unknown[], portails: [] as unknown[] };
vi.mock('@/lib/stripe', () => ({
  STRIPE_API_VERSION: '2025-12-15.clover',
  stripeClient: () => ({
    customers: { create: async (p: unknown) => { appels.clients.push(p); return { id: `cus_${appels.clients.length}` }; } },
    checkout: { sessions: { create: async (p: unknown) => { appels.sessions.push(p); return { url: 'https://checkout.stripe.test/s' }; } } },
    billingPortal: { sessions: { create: async (p: unknown) => { appels.portails.push(p); return { url: 'https://billing.stripe.test/p' }; } } },
  }),
}));

// Importés après le double, pour qu'ils le voient.
const { POST: caisse } = await import('@/app/api/v1/stripe/checkout/route');
const { POST: portail } = await import('@/app/api/v1/stripe/portal/route');

const env = { ...process.env };
beforeAll(() => { process.env.NEXT_PUBLIC_APP_URL = 'https://mif.test'; });
afterAll(() => { process.env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL; });
beforeEach(async () => {
  appels.clients = []; appels.sessions = []; appels.portails = [];
  await prisma.subscriptionPlan.upsert({
    where: { tier: 'PREMIUM' },
    create: { tier: 'PREMIUM', name: 'Premium', priceMonthly: 29, priceYearly: 290 },
    update: { name: 'Premium', priceMonthly: 29, priceYearly: 290 },
  });
});

async function proprietaireEtMarque() {
  const u = await creerUtilisateur('USER', `proprio-${Math.random().toString(36).slice(2)}`);
  const m = await creerMarque();
  await prisma.brandOwner.create({ data: { brandId: m.id, userId: u.id, role: 'OWNER', isActive: true, acceptedAt: new Date() } });
  return { u, m };
}

describe('POST /api/v1/stripe/checkout — refus avant tout appel', () => {
  test('anonyme : 401', async () => {
    const m = await creerMarque();
    sessionDe(null);
    const r = await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'monthly' }), {});
    expect(r.status).toBe(401);
    expect(appels.clients).toHaveLength(0);
  });

  test('connecté mais pas propriétaire : 403, et le stripeCustomerId de la marque reste vide', async () => {
    const m = await creerMarque();
    const intrus = await creerUtilisateur('USER');
    sessionDe(intrus.id);
    const r = await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'monthly' }), {});
    expect(r.status).toBe(403);
    expect(appels.clients).toHaveLength(0);
    expect((await prisma.brand.findUniqueOrThrow({ where: { id: m.id } })).stripeCustomerId).toBeNull();
  });

  test('palier ou cycle hors liste : 400 (Zod), sans un seul appel à Stripe', async () => {
    const { u, m } = await proprietaireEtMarque();
    sessionDe(u.id);
    expect((await caisse(requete('POST', { brandSlug: m.slug, plan: 'FREE', billingCycle: 'monthly' }), {})).status).toBe(400);
    expect((await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'weekly' }), {})).status).toBe(400);
    expect((await caisse(requete('POST', { brandSlug: m.slug }), {})).status).toBe(400);
    expect(appels.sessions).toHaveLength(0);
  });

  test('un palier sans tarif en base : 400, jamais un prix par défaut', async () => {
    const { u, m } = await proprietaireEtMarque();
    sessionDe(u.id);
    await prisma.subscriptionPlan.update({ where: { tier: 'PREMIUM' }, data: { priceYearly: null } });
    const r = await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'yearly' }), {});
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/tarif/i);
    expect(appels.sessions).toHaveLength(0);

    await prisma.subscriptionPlan.delete({ where: { tier: 'ROYALE' } }).catch(() => undefined);
    const r2 = await caisse(requete('POST', { brandSlug: m.slug, plan: 'ROYALE', billingCycle: 'monthly' }), {});
    expect(r2.status).toBe(400);
    expect(appels.sessions).toHaveLength(0);
  });
});

describe('POST /api/v1/stripe/checkout — ce qui part vers Stripe', () => {
  test('le prix vient de la base, l e-mail de la session, le client est créé une seule fois', async () => {
    const { u, m } = await proprietaireEtMarque();
    sessionDe(u.id);

    const r1 = await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'yearly', userEmail: 'pirate@ailleurs.test' }), {});
    expect(r1.status).toBe(200);
    expect((await r1.json()).url).toBe('https://checkout.stripe.test/s');

    expect(appels.clients).toHaveLength(1);
    expect((appels.clients[0] as { email: string }).email).toBe(u.email);
    const session = appels.sessions[0] as { customer: string; line_items: { price_data: { unit_amount: number; recurring: { interval: string } } }[]; metadata: Record<string, string>; success_url: string };
    expect(session.customer).toBe('cus_1');
    expect(session.line_items[0].price_data.unit_amount).toBe(29_000); // 290 € en centimes, depuis la base
    expect(session.line_items[0].price_data.recurring.interval).toBe('year');
    expect(session.metadata.brandId).toBe(m.id);
    expect(session.success_url).toBe(`https://mif.test/studio/marque/${m.slug}/abonnement?success=true`);
    expect((await prisma.brand.findUniqueOrThrow({ where: { id: m.id } })).stripeCustomerId).toBe('cus_1');

    // Second passage : le client Stripe existe, on ne le recrée pas.
    const r2 = await caisse(requete('POST', { brandSlug: m.slug, plan: 'PREMIUM', billingCycle: 'monthly' }), {});
    expect(r2.status).toBe(200);
    expect(appels.clients).toHaveLength(1);
    expect((appels.sessions[1] as typeof session).customer).toBe('cus_1');
    expect((appels.sessions[1] as typeof session).line_items[0].price_data.unit_amount).toBe(2_900);
  });
});

describe('POST /api/v1/stripe/portal', () => {
  test('sans abonnement : 404 ; intrus : 403 ; anonyme : 401 — aucun portail ouvert', async () => {
    const { u, m } = await proprietaireEtMarque();
    sessionDe(u.id);
    expect((await portail(requete('POST', { brandSlug: m.slug }), {})).status).toBe(404);

    await prisma.brand.update({ where: { id: m.id }, data: { stripeCustomerId: 'cus_abonne' } });
    const intrus = await creerUtilisateur('USER');
    sessionDe(intrus.id);
    expect((await portail(requete('POST', { brandSlug: m.slug }), {})).status).toBe(403);
    sessionDe(null);
    expect((await portail(requete('POST', { brandSlug: m.slug }), {})).status).toBe(401);
    expect(appels.portails).toHaveLength(0);
  });

  test('propriétaire d une marque abonnée : le portail de SON client, retour vers sa page', async () => {
    const { u, m } = await proprietaireEtMarque();
    await prisma.brand.update({ where: { id: m.id }, data: { stripeCustomerId: 'cus_abonne' } });
    sessionDe(u.id);
    const r = await portail(requete('POST', { brandSlug: m.slug }), {});
    expect(r.status).toBe(200);
    expect((await r.json()).url).toBe('https://billing.stripe.test/p');
    expect(appels.portails[0]).toEqual({ customer: 'cus_abonne', return_url: `https://mif.test/studio/marque/${m.slug}/abonnement` });
  });
});

describe('GET /api/v1/plans', () => {
  test('les tarifs affichés sont ceux de la base, et rien de Stripe ne fuit', async () => {
    const { GET: plans } = await import('@/app/api/v1/plans/route');
    await prisma.subscriptionPlan.update({
      where: { tier: 'PREMIUM' },
      data: { priceMonthly: 31, priceYearly: 310, stripePriceIdMonthly: 'price_secret_mensuel' },
    });

    const r = await plans(requete('GET'), {});
    expect(r.status).toBe(200);
    const texte = await r.text();
    expect(texte).not.toContain('price_secret_mensuel');
    expect(texte.toLowerCase()).not.toContain('stripe');

    const premium = JSON.parse(texte).data.find((p: { tier: string }) => p.tier === 'PREMIUM');
    expect(premium.priceMonthly).toBe(31);
    expect(premium.priceYearly).toBe(310);
  });
});
