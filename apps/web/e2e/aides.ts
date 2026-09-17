import { expect, type Page } from '@playwright/test';

/** Connexion par le formulaire du Studio, le seul à accepter un mot de passe. */
export async function seConnecter(page: Page, email: string, motDePasse: string): Promise<void> {
  await page.goto('/studio/connexion');
  await page.getByPlaceholder('contact@votre-entreprise.fr').fill(email);
  await page.getByPlaceholder('Votre mot de passe').fill(motDePasse);
  await page.getByRole('button', { name: /se connecter/i }).click();
  // Sans marque, le Studio renvoie vers la revendication : c'est la preuve que la session existe.
  await expect(page).toHaveURL(/\/studio\/(revendiquer|marque)/, { timeout: 15_000 });

  // La redirection précède parfois l'écriture du cookie de session : un appel d'API
  // lancé juste après repartait alors en 401, une fois sur dix. On attend la session
  // elle-même, pas l'URL qui la laisse espérer.
  await expect
    .poll(async () => (await (await page.request.get('/api/auth/session')).json())?.user?.email, { timeout: 10_000 })
    .toBe(email);
}
