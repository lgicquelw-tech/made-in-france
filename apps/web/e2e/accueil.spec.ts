/**
 * L'accueil : des produits d'entrée, puis un fil qui s'adapte (REBUILD.md T8.9).
 *
 * Le scénario Vinted : j'arrive, je vois des produits ; je cherche quelque chose ; je
 * reviens, le fil me le remonte et me dit pourquoi ; je peux effacer. Tout cela sans
 * compte — les signaux vivent dans le navigateur.
 */

import { expect, test } from '@playwright/test';
import { DONNEES } from './donnees';

test('des produits dans le premier ecran, rendus par le serveur', async ({ page }) => {
  await page.goto('/');
  // Le lien produit est dans le HTML servi : on le trouve avant toute hydratation.
  const carte = page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') }).first();
  await expect(carte).toBeVisible();
  const boite = await carte.boundingBox();
  expect(boite!.y).toBeLessThan(900); // dans le premier écran d'un 1280×900
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Fabriqué en France/);
});

test('apres une recherche, le fil devient « Pour vous » et peut etre reinitialise', async ({ page }) => {
  await page.goto('/recherche?q=marin');
  await expect(page.getByRole('link', { name: new RegExp(DONNEES.produit.name, 'i') }).first()).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Pour vous' })).toBeVisible();
  await expect(page.getByText(/d'après vos recherches/i)).toBeVisible();

  // Le signal est dans le navigateur, et nulle part ailleurs.
  const signaux = await page.evaluate(() => localStorage.getItem('mif.signaux.v1'));
  expect(signaux).toContain('marin');

  await page.getByRole('button', { name: 'réinitialiser' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Fabriqué en France/);
  expect(await page.evaluate(() => localStorage.getItem('mif.signaux.v1'))).toBeNull();
});

test('visiter une marque nourrit aussi le fil', async ({ page }) => {
  await page.goto(`/marques/${DONNEES.marque.slug}`);
  const signaux = await page.evaluate(() => JSON.parse(localStorage.getItem('mif.signaux.v1') ?? '{}'));
  expect(Object.keys(signaux.marques ?? {})).toContain(DONNEES.marque.slug);
  expect(Object.keys(signaux.secteurs ?? {})).toContain('mode-accessoires');
});
