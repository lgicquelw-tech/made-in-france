/**
 * Inscription, revendication, édition Studio, édition admin (REBUILD.md T6.5) — les
 * quatre parcours qui attendaient la disparition d'Express.
 *
 * Le point commun : ce qu'on vérifie **en base** compte plus que l'écran. Une inscription
 * avec revendication doit laisser une demande PENDING et aucun propriétaire (règle n°0) ;
 * une édition doit laisser une entrée d'audit (T3.14).
 */

import { expect, test, type Page } from '@playwright/test';
import { DONNEES } from './donnees';
import { seConnecter } from './aides';
import { baseDeTest } from './base';

test.afterAll(() => baseDeTest.$disconnect());

/** Le formulaire d'inscription en deux étapes ; retourne quand l'API a répondu. */
async function sInscrire(page: Page, courriel: string): Promise<void> {
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(courriel);
  await page.getByPlaceholder('Minimum 12 caractères').fill(DONNEES.inscrit.password);
  await page.getByPlaceholder('Confirmez votre mot de passe').fill(DONNEES.inscrit.password);
  await page.getByRole('button', { name: /continuer/i }).click();
  await page.getByPlaceholder('Votre nom complet').fill(DONNEES.inscrit.name);
  // Avec une marque revendiquée, le nom d'entreprise est prérempli et verrouillé.
  const entreprise = page.getByPlaceholder('Nom de votre entreprise');
  if (await entreprise.isEnabled()) await entreprise.fill(DONNEES.inscrit.companyName);
  const reponse = page.waitForResponse((r) => r.url().includes('/api/auth/register'));
  await page.getByRole('button', { name: /créer mon compte/i }).click();
  expect((await reponse).status()).toBe(201);
}

test('inscription sans marque : un compte ordinaire, rien de plus', async ({ page }) => {
  await page.goto('/studio/inscription');
  await sInscrire(page, DONNEES.inscrit.email);
  await expect(page).toHaveURL(/\/studio\/bienvenue/, { timeout: 15_000 });

  const compte = await baseDeTest.user.findUnique({
    where: { email: DONNEES.inscrit.email },
    select: { role: true, isActive: true, password: true, ownedBrands: { select: { id: true } } },
  });
  expect(compte?.role).toBe('USER');
  expect(compte?.isActive).toBe(true);
  expect(compte?.password).not.toBe(DONNEES.inscrit.password); // haché, jamais en clair
  expect(compte?.ownedBrands).toHaveLength(0);
});

test('un mot de passe de 8 caractères est refusé avant tout appel', async ({ page }) => {
  await page.goto('/studio/inscription');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill('court@test.local');
  await page.getByPlaceholder('Minimum 12 caractères').fill('huitcar8');
  await page.getByPlaceholder('Confirmez votre mot de passe').fill('huitcar8');
  await page.getByRole('button', { name: /continuer/i }).click();
  await expect(page.getByText(/au moins 12 caractères/)).toBeVisible();
  await expect(page.getByPlaceholder('Votre nom complet')).toHaveCount(0);
});

test('revendication : une demande PENDING, et aucun droit accordé', async ({ page }) => {
  // 1. Trouver sa marque.
  await page.goto('/studio/revendiquer');
  await page.getByPlaceholder('Nom de votre entreprise...').fill('atelier');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: new RegExp(DONNEES.marque.name, 'i') }).first().click();
  await page.getByRole('button', { name: /continuer/i }).click();
  await expect(page).toHaveURL(new RegExp(`/studio/inscription\\?claim=${DONNEES.marque.slug}`));

  // 2. Créer le compte lié.
  const courriel = 'revendiquant@test.local';
  await sInscrire(page, courriel);
  // Le formulaire connecte le compte puis l'envoie vers l'espace de la marque.
  await expect(page).toHaveURL(new RegExp(`/studio/marque/${DONNEES.marque.slug}`), { timeout: 15_000 });

  // 3. Ce qui existe en base : une demande à examiner. Pas un propriétaire.
  const demande = await baseDeTest.brandClaimRequest.findFirst({
    where: { email: courriel }, select: { status: true, brand: { select: { slug: true } }, userId: true },
  });
  expect(demande?.status).toBe('PENDING');
  expect(demande?.brand.slug).toBe(DONNEES.marque.slug);
  const droits = await baseDeTest.brandOwner.count({ where: { user: { email: courriel } } });
  expect(droits).toBe(0);

  // 4. Connecté, mais le tableau de bord de la marque lui reste fermé : 403, pas 401.
  const r = await page.request.get(`/api/v1/brands/${DONNEES.marque.slug}/dashboard`);
  expect(r.status()).toBe(403);
});

test('édition Studio : le propriétaire modifie, la fiche publique suit, l audit garde la trace', async ({ page }) => {
  await seConnecter(page, DONNEES.proprietaire.email, DONNEES.proprietaire.password);
  await page.goto(`/studio/marque/${DONNEES.marque.slug}/parametres`);

  const texte = `Tricot breton édité dans le Studio à ${Date.now()}.`;
  const champ = page.getByPlaceholder('Une phrase qui décrit votre entreprise...');
  await expect(champ).toBeVisible({ timeout: 15_000 });
  await champ.fill(texte);

  const alerte = page.waitForEvent('dialog');
  await page.getByRole('button', { name: /enregistrer/i }).click();
  const dialogue = await alerte;
  expect(dialogue.message()).toMatch(/enregistrées/i);
  await dialogue.accept();

  await page.goto(`/marques/${DONNEES.marque.slug}`);
  await expect(page.getByText(texte)).toBeVisible();

  const trace = await baseDeTest.auditLog.findFirst({
    where: { action: 'brand.update', userEmail: DONNEES.proprietaire.email }, orderBy: { createdAt: 'desc' },
  });
  expect(trace).not.toBeNull();
  expect(JSON.stringify(trace?.changes)).toContain('descriptionShort');
});

test('un utilisateur ordinaire ne peut pas écrire sur une marque : 403', async ({ page }) => {
  await seConnecter(page, DONNEES.utilisateur.email, DONNEES.utilisateur.password);
  const r = await page.request.put(`/api/v1/brands/${DONNEES.marque.slug}/dashboard`, {
    data: { descriptionShort: 'Tentative depuis un compte sans droit sur la marque.' },
  });
  expect(r.status()).toBe(403);
  const fiche = await baseDeTest.brand.findUnique({ where: { slug: DONNEES.marque.slug }, select: { descriptionShort: true } });
  expect(fiche?.descriptionShort).not.toContain('Tentative');
});

test('édition admin : modification, fiche publique, trace d audit signée', async ({ page }) => {
  await seConnecter(page, DONNEES.admin.email, DONNEES.admin.password);
  const marque = await baseDeTest.brand.findUniqueOrThrow({ where: { slug: DONNEES.marque.slug }, select: { id: true } });
  await page.goto(`/admin/marques/${marque.id}`);

  // La description s'édite en place : un clic sur le paragraphe ouvre la zone de saisie.
  const texte = `Tricot breton édité par l'administration à ${Date.now()}.`;
  await page.getByText(/description courte|Tricot breton/).first().click();
  const champ = page.getByPlaceholder('Description courte de la marque...');
  await expect(champ).toBeVisible();
  await champ.fill(texte);
  await champ.blur();

  const alerte = page.waitForEvent('dialog');
  await page.getByRole('button', { name: /^enregistrer$/i }).click();
  const dialogue = await alerte;
  expect(dialogue.message()).toMatch(/succès/i);
  await dialogue.accept();

  await page.goto(`/marques/${DONNEES.marque.slug}`);
  await expect(page.getByText(texte)).toBeVisible();

  const trace = await baseDeTest.auditLog.findFirst({
    where: { action: 'brand.update', userEmail: DONNEES.admin.email }, orderBy: { createdAt: 'desc' },
  });
  expect(trace?.targetId).toBe(marque.id);
});

test('connexion : un rejet technique ne fait jamais croire qu on est connecté', async ({ page }) => {
  // On valide le formulaire dans la seconde qui suit l'ouverture de la page — le cas qui
  // déclenchait le rejet anti-CSRF de NextAuth. L'écran redirigeait alors vers le Studio
  // **sans session**. Quelle que soit l'issue, l'une des deux seules fins acceptables :
  // une session ouverte, ou un message d'erreur sur la page de connexion.
  await page.goto('/studio/connexion');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(DONNEES.utilisateur.email);
  await page.getByPlaceholder('Votre mot de passe').fill(DONNEES.utilisateur.password);
  await page.getByRole('button', { name: /se connecter/i }).click();

  await expect
    .poll(async () => {
      const session = await (await page.request.get('/api/auth/session')).json();
      if (session?.user?.email) return 'session';
      if (/\/studio\/connexion/.test(page.url()) && (await page.getByText(/échoué|incorrect/i).count()) > 0) return 'erreur affichée';
      return 'ni l un ni l autre';
    }, { timeout: 20_000 })
    .not.toBe('ni l un ni l autre');
});
