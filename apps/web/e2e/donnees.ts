/** Le jeu de données semé avant les parcours — connu, minimal, stable. */
export const DONNEES = {
  marque: { name: 'ATELIER TEST', slug: 'atelier-test', city: 'Rennes', websiteUrl: 'https://www.atelier-test.example' },
  produit: {
    name: 'Pull Marin Test', slug: 'atelier-test-pull-marin-test', priceMin: 89,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=640',
    externalBuyUrl: 'https://www.atelier-test.example/products/pull-marin',
    descriptionShort: 'Un pull marin en laine vierge tricoté en Bretagne, pour les tests de parcours.',
  },
  utilisateur: { email: 'visiteur@test.local', password: 'mot-de-passe-de-test-long', name: 'Visiteur Test' },
  admin: { email: 'admin@test.local', password: 'mot-de-passe-admin-long', name: 'Admin Test' },
} as const;
