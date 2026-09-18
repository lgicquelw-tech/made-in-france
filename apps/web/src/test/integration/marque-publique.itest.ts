/**
 * Le statut d'une marque décide de sa visibilité publique (décision du 18 septembre 2026).
 *
 * Une marque suspendue disparaît de l'annuaire, de la recherche, de la carte et de
 * l'assistant ; une marque en attente n'est pas listée mais reste joignable par le Studio
 * pour son propriétaire, et par la recherche de revendication pour qui veut la réclamer.
 */

import { describe, expect, test } from 'vitest';
import { prisma } from '@/lib/db';
import { GET as annuaire } from '@/app/api/v1/brands/route';
import { GET as recherche } from '@/app/api/v1/search/all/route';
import { GET as carte } from '@/app/api/v1/brands/with-coords-and-labels/route';
import { GET as auHasard } from '@/app/api/v1/brands/random/route';
import { GET as rechercheRevendication } from '@/app/api/v1/brands/search/route';
import { GET as tableauDeBord } from '@/app/api/v1/brands/[slug]/dashboard/route';
import { creerMarque, creerUtilisateur, requete, sessionDe } from './aides';

async function marqueAvecStatut(slug: string, status: 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED') {
  const m = await creerMarque(slug);
  await prisma.brand.update({ where: { id: m.id }, data: { status, latitude: 48.1, longitude: -1.6, descriptionShort: `Atelier ${slug}` } });
  return m;
}

describe('listes publiques', () => {
  test('annuaire, recherche, carte : ACTIVE seulement', async () => {
    await marqueAvecStatut('visible-publique', 'ACTIVE');
    await marqueAvecStatut('visible-attente', 'PENDING_REVIEW');
    await marqueAvecStatut('visible-suspendue', 'SUSPENDED');

    const liste = await (await annuaire(new Request('http://test.local/api/v1/brands?q=visible'), {})).json();
    const slugsListe = liste.data.map((b: { slug: string }) => b.slug);
    expect(slugsListe).toEqual(['visible-publique']);

    const trouve = await (await recherche(new Request('http://test.local/api/v1/search/all?q=visible'), {})).json();
    const slugsRecherche = (trouve.data?.brands ?? trouve.brands ?? []).map((b: { slug: string }) => b.slug);
    expect(slugsRecherche).toContain('visible-publique');
    expect(slugsRecherche).not.toContain('visible-attente');
    expect(slugsRecherche).not.toContain('visible-suspendue');

    const points = await (await carte(requete('GET'), {})).json();
    const slugsCarte = (points.data ?? points).map((b: { slug: string }) => b.slug);
    expect(slugsCarte).toContain('visible-publique');
    expect(slugsCarte).not.toContain('visible-suspendue');
    expect(slugsCarte).not.toContain('visible-attente');
  });

  test('au hasard : jamais une marque non publique', async () => {
    await marqueAvecStatut('seule-suspendue', 'SUSPENDED');
    // Aucune marque ACTIVE en base : 404 plutôt qu'une fiche qu'on ne devrait pas montrer.
    expect((await auHasard(requete('GET'), {})).status).toBe(404);
    await marqueAvecStatut('seule-active', 'ACTIVE');
    const r = await auHasard(requete('GET'), {});
    expect(r.status).toBe(200);
    expect((await r.json()).data.slug).toBe('seule-active');
  });
});

describe('ce qui reste joignable', () => {
  test('une marque en attente se revendique, et son propriétaire la voit dans le Studio', async () => {
    const m = await marqueAvecStatut('en-attente-joignable', 'PENDING_REVIEW');
    const r = await rechercheRevendication(new Request('http://test.local/api/v1/brands/search?q=joignable'), {});
    expect((await r.json()).data.map((b: { slug: string }) => b.slug)).toContain(m.slug);

    const proprio = await creerUtilisateur('USER');
    await prisma.brandOwner.create({ data: { brandId: m.id, userId: proprio.id, role: 'OWNER', isActive: true, acceptedAt: new Date() } });
    sessionDe(proprio.id);
    expect((await tableauDeBord(requete('GET'), { params: { slug: m.slug } })).status).toBe(200);
  });
});
