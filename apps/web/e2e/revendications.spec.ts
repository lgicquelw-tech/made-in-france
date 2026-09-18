/**
 * Le tour complet d'une revendication (REBUILD.md T8.1) : une personne demande la gestion
 * d'une marque, un administrateur l'examine, et **alors seulement** elle peut éditer.
 *
 * C'est la règle n°0 vue de bout en bout. Le parcours vérifie aussi ce qui ne doit pas
 * arriver : avant la décision, la personne n'a aucun droit.
 */

import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { DONNEES } from './donnees';
import { seConnecter } from './aides';
import { baseDeTest } from './base';

const DEMANDEUR = { email: 'demandeur@test.local', password: 'mot-de-passe-demandeur-long', name: 'Camille Martin' };

test.afterAll(() => baseDeTest.$disconnect());

test('revendication : refusée, puis accordée, et la gestion suit', async ({ page }) => {
  const marque = await baseDeTest.brand.findUniqueOrThrow({ where: { slug: DONNEES.marqueAccentuee.slug } });
  const compte = await baseDeTest.user.upsert({
    where: { email: DEMANDEUR.email },
    create: { email: DEMANDEUR.email, name: DEMANDEUR.name, password: await bcrypt.hash(DEMANDEUR.password, 10), role: 'USER', isActive: true },
    update: {},
  });
  await baseDeTest.brandClaimRequest.deleteMany({ where: { userId: compte.id } });
  await baseDeTest.brandOwner.deleteMany({ where: { userId: compte.id } });
  await baseDeTest.brandClaimRequest.create({ data: {
    brandId: marque.id, userId: compte.id, email: DEMANDEUR.email,
    firstName: 'Camille', lastName: 'Martin', proofType: 'declaration', status: 'PENDING',
  } });

  // 1. Avant toute décision : aucun droit sur la marque.
  await seConnecter(page, DEMANDEUR.email, DEMANDEUR.password);
  expect((await page.request.get(`/api/v1/brands/${marque.slug}/dashboard`)).status()).toBe(403);

  // 2. L'administrateur trouve la demande dans sa file et l'accorde.
  await seConnecter(page, DONNEES.admin.email, DONNEES.admin.password);
  await page.goto('/admin/revendications');
  // Une seule demande en attente dans cette base : les repères de la page suffisent.
  await expect(page.getByRole('link', { name: new RegExp(marque.name, 'i') })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(DEMANDEUR.email)).toBeVisible();
  await page.getByLabel(/motif de la décision/i).fill('Vérification faite par téléphone.');
  await page.getByRole('button', { name: /accorder/i }).click();

  await expect(page.getByText(/aucune demande dans cet état/i)).toBeVisible({ timeout: 15_000 });

  // 3. En base : un propriétaire, une trace signée de l'administrateur.
  const droit = await baseDeTest.brandOwner.findFirstOrThrow({ where: { userId: compte.id, brandId: marque.id } });
  expect(droit.role).toBe('OWNER');
  const trace = await baseDeTest.auditLog.findFirst({ where: { action: 'claim.approve', targetId: marque.id }, orderBy: { createdAt: 'desc' } });
  expect(trace?.userEmail).toBe(DONNEES.admin.email);

  // 4. Et la personne peut enfin éditer sa fiche.
  await seConnecter(page, DEMANDEUR.email, DEMANDEUR.password);
  expect((await page.request.get(`/api/v1/brands/${marque.slug}/dashboard`)).status()).toBe(200);
});

test('la file d administration est fermée à un compte ordinaire', async ({ page }) => {
  await seConnecter(page, DONNEES.utilisateur.email, DONNEES.utilisateur.password);
  expect((await page.request.get('/api/admin/claims')).status()).toBe(403);
  const r = await page.goto('/admin/revendications');
  expect(r?.status()).toBe(404);
});
