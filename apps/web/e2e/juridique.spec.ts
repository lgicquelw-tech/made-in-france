/**
 * Conformité (REBUILD.md T7.5) : les textes existent derrière les liens du pied de page,
 * les fiches disent d'où viennent leurs données, et une personne exerce ses droits —
 * export, suppression — sans écrire à qui que ce soit.
 */

import { expect, test } from '@playwright/test';
import { DONNEES } from './donnees';
import { seConnecter } from './aides';

for (const [chemin, titre] of [
  ['/mentions-legales', /mentions légales/i],
  ['/confidentialite', /confidentialité/i],
  ['/cgu', /conditions d.utilisation/i],
  ['/contact', /contact/i],
] as const) {
  test(`${chemin} répond et porte son titre`, async ({ page }) => {
    const r = await page.goto(chemin);
    expect(r?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titre);
  });
}

test('le pied de page ne mène à aucune 404', async ({ page, request }) => {
  await page.goto('/');
  const liens = await page.locator('footer a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))]);
  expect(liens.length).toBeGreaterThan(5);
  for (const href of liens) {
    const r = await request.get(href);
    expect(r.status(), href).toBeLessThan(400);
  }
});

test('une fiche produit dit d où viennent ses données', async ({ page }) => {
  await page.goto(`/produits/${DONNEES.produit.slug}`);
  await expect(page.getByText(/relevés sur atelier-test\.example|fournies par ATELIER TEST/)).toBeVisible();
  await expect(page.getByRole('link', { name: /demandez son retrait/i })).toHaveAttribute('href', '/contact');
});

test('export : un JSON qui contient mes données et pas un mot de passe', async ({ page }) => {
  await seConnecter(page, DONNEES.utilisateur.email, DONNEES.utilisateur.password);
  const r = await page.request.get('/api/v1/me/export');
  expect(r.status()).toBe(200);
  expect(r.headers()['content-disposition']).toContain('attachment');
  const texte = await r.text();
  expect(JSON.parse(texte).compte.email).toBe(DONNEES.utilisateur.email);
  expect(texte).not.toContain(DONNEES.utilisateur.password);
  expect(texte).not.toContain('$2'); // haché bcrypt
});

test('suppression : confirmation par l adresse, puis le compte n existe plus', async ({ page }) => {
  await seConnecter(page, DONNEES.ephemere.email, DONNEES.ephemere.password);
  await page.goto('/profil');

  await page.getByRole('button', { name: /supprimer mon compte/i }).click();
  const definitif = page.getByRole('button', { name: /supprimer définitivement/i });
  await expect(definitif).toBeDisabled();
  await page.getByLabel(/votre adresse e-mail, pour confirmer/i).fill(DONNEES.ephemere.email);
  await expect(definitif).toBeEnabled();
  await definitif.click();

  await expect(page).toHaveURL(/compte=supprime/, { timeout: 15_000 });

  // Se reconnecter est impossible : le compte n'est plus là.
  await page.goto('/studio/connexion');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(DONNEES.ephemere.email);
  await page.getByPlaceholder('Votre mot de passe').fill(DONNEES.ephemere.password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/\/studio\/connexion/);
  await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible();
});
