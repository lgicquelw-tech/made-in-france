/**
 * Connexion, favoris, et les portes fermées (REBUILD.md T6.5).
 *
 * Ce qu'on vérifie côté « refus » compte autant que le reste : un visiteur anonyme
 * envoyé vers la connexion, un utilisateur ordinaire qui ne voit pas l'administration.
 */

import { expect, test } from '@playwright/test';
import { DONNEES } from './donnees';
import { seConnecter } from './aides';

test('anonyme : /favoris renvoie vers la connexion, avec retour prévu', async ({ page }) => {
  await page.goto('/favoris');
  await expect(page).toHaveURL(/\/connexion\?callbackUrl=%2Ffavoris/);
});

test('anonyme : /admin renvoie vers la connexion', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/connexion/);
});

test('mauvais mot de passe : refusé, on reste sur la page', async ({ page }) => {
  await page.goto('/studio/connexion');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(DONNEES.utilisateur.email);
  await page.getByPlaceholder('Votre mot de passe').fill('faux-mot-de-passe-evidemment');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/studio\/connexion/);
  await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible();
});

test('connexion, puis un favori qui apparaît dans /favoris', async ({ page }) => {
  await seConnecter(page, DONNEES.utilisateur.email, DONNEES.utilisateur.password);

  await page.goto(`/marques/${DONNEES.marque.slug}`);
  const bouton = page.getByTitle('Ajouter aux favoris').first();
  await expect(bouton).toBeVisible();
  await bouton.click();
  await expect(page.getByTitle('Retirer des favoris').first()).toBeVisible();

  await page.goto('/favoris');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.marque.name, 'i') }).first()).toBeVisible();
});

test('un utilisateur ordinaire ne voit pas l administration : 404', async ({ page }) => {
  await seConnecter(page, DONNEES.utilisateur.email, DONNEES.utilisateur.password);
  const r = await page.goto('/admin');
  expect(r?.status()).toBe(404);
});

test('un administrateur entre dans l administration', async ({ page }) => {
  await seConnecter(page, DONNEES.admin.email, DONNEES.admin.password);
  const r = await page.goto('/admin');
  expect(r?.status()).toBe(200);
  await expect(page).toHaveURL(/\/admin$/);
});
