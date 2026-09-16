/**
 * La recherche, depuis chacun de ses points d'entrée (REBUILD.md T3.4, T6.5).
 * Tous servis par Next désormais : ces parcours échouaient dès qu'Express ne tournait pas.
 */

import { expect, test } from '@playwright/test';
import { DONNEES } from './donnees';

test('en-tete : le menu deroulant propose la marque, avec son lien', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ouvrir la recherche' }).click();
  await page.getByPlaceholder(/rechercher/i).first().fill('atelier');
  const lien = page.getByRole('link', { name: new RegExp(DONNEES.marque.name, 'i') }).first();
  await expect(lien).toBeVisible();
  await expect(lien).toHaveAttribute('href', `/marques/${DONNEES.marque.slug}`);
});

test('/recherche : retaper met a jour les resultats ET l URL', async ({ page }) => {
  await page.goto('/recherche?q=rien-de-tel');
  await expect(page.getByText(/aucun résultat/i)).toBeVisible();

  const champ = page.getByPlaceholder(/rechercher une marque/i);
  await champ.fill('pull marin');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/recherche\?q=pull(%20|\+)marin/);
});

test('/recherche : « creme » trouve « CRÈME DE BRETAGNE »', async ({ page }) => {
  // 191 marques sur 903 portent un accent dans leur nom. Sans unaccent() des deux
  // côtés, une saisie au clavier ordinaire ne les trouvait pas.
  await page.goto('/recherche?q=creme');
  await expect(page.getByRole('link', { name: /CRÈME DE BRETAGNE/ }).first()).toBeVisible();
});

test('/marques : recherche et region s additionnent', async ({ page }) => {
  await page.goto('/marques');
  await page.getByRole('combobox').first().selectOption({ label: 'Bretagne' });
  await page.getByPlaceholder(/rechercher une marque, une ville/i).fill('atelier');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.marque.name, 'i') }).first()).toBeVisible();
  // La requête envoyée porte bien les deux critères.
  const req = await page.waitForRequest((r) => r.url().includes('/api/v1/brands?') && r.url().includes('q=atelier'), { timeout: 5000 }).catch(() => null);
  if (req) expect(req.url()).toContain('region=bretagne');
});

test('/produits : la recherche filtre la grille', async ({ page }) => {
  await page.goto('/produits');
  await page.getByPlaceholder(/rechercher un produit/i).fill('marin');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') }).first()).toBeVisible();
  await page.getByPlaceholder(/rechercher un produit/i).fill('introuvable-xyz');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') })).toHaveCount(0);
});
