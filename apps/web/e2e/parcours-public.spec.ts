/**
 * Le parcours qui fait vivre l'annuaire (REBUILD.md T6.5) :
 * recherche → marque → produit → clic d'achat. Si l'un de ces maillons casse, le site
 * ne sert plus à rien, quel que soit l'état du reste.
 */

import { expect, test } from '@playwright/test';
import { DONNEES } from './donnees';

test('recherche → marque → produit → lien d achat', async ({ page }) => {
  // 1. La recherche est rendue côté serveur : un lien partagé montre ses résultats.
  await page.goto(`/recherche?q=${encodeURIComponent('atelier')}`);
  const lienMarque = page.getByRole('link', { name: new RegExp(DONNEES.marque.name, 'i') }).first();
  await expect(lienMarque).toBeVisible();

  // 2. La fiche marque.
  await lienMarque.click();
  await expect(page).toHaveURL(new RegExp(`/marques/${DONNEES.marque.slug}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(DONNEES.marque.name);

  // 3. Le produit, depuis la fiche marque.
  const lienProduit = page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') }).first();
  await expect(lienProduit).toBeVisible();
  await lienProduit.click();
  await expect(page).toHaveURL(new RegExp(`/produits/${DONNEES.produit.slug}$`));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(DONNEES.produit.name);
  await expect(page.getByText('89,00 €').first()).toBeVisible();

  // 4. Le lien d'achat : la bonne URL, ouvert dans un nouvel onglet, sans fuite de referrer.
  const achat = page.locator(`a[href="${DONNEES.produit.externalBuyUrl}"]`).first();
  await expect(achat).toBeVisible();
  await expect(achat).toHaveAttribute('target', '_blank');
  await expect(achat).toHaveAttribute('rel', /noopener/);
});

test('la fiche produit porte ses données structurées', async ({ page }) => {
  await page.goto(`/produits/${DONNEES.produit.slug}`);
  const blocs = await page.locator('script[type="application/ld+json"]').allTextContents();
  const produit = blocs.map((b) => JSON.parse(b)).find((d) => d['@type'] === 'Product');
  expect(produit).toBeTruthy();
  expect(produit.offers.price).toBe(DONNEES.produit.priceMin);
  expect(produit.offers.url).toBe(DONNEES.produit.externalBuyUrl);
});

test('une fiche inexistante renvoie 404', async ({ page }) => {
  const r = await page.goto('/produits/n-existe-pas');
  expect(r?.status()).toBe(404);
});

test('la carte annonce les marques geolocalisees', async ({ page }) => {
  // Les points viennent de /api/v1/brands/with-coords-and-labels, servie par Next
  // depuis T3.8. Sans NEXT_PUBLIC_MAPBOX_TOKEN la page n'affiche qu'un message de
  // configuration : la CI fournit un jeton factice, les tuiles echouent, le compte s'affiche.
  await page.goto('/carte');
  await expect(page.getByText(/2 marques affichées/)).toBeVisible({ timeout: 15_000 });
});
