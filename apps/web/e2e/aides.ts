import { expect, type Page } from '@playwright/test';

/** Connexion par le formulaire du Studio, le seul à accepter un mot de passe. */
export async function seConnecter(page: Page, email: string, motDePasse: string): Promise<void> {
  await page.goto('/studio/connexion');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(email);
  await page.getByPlaceholder('Votre mot de passe').fill(motDePasse);
  await page.getByRole('button', { name: /se connecter/i }).click();
  // Sans marque, le Studio renvoie vers la revendication : c'est la preuve que la session existe.
  await expect(page).toHaveURL(/\/studio\/(revendiquer|marque)/, { timeout: 15_000 });
}
