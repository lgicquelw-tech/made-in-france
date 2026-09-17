/** Le jeu de données semé avant les parcours — connu, minimal, stable. */
export const DONNEES = {
  marque: { name: 'ATELIER TEST', slug: 'atelier-test', city: 'Rennes', websiteUrl: 'https://www.atelier-test.example', latitude: 48.1173, longitude: -1.6778 },
  /** Une marque au nom accentué, pour prouver que « creme » la trouve. */
  marqueAccentuee: { name: 'CRÈME DE BRETAGNE', slug: 'creme-de-bretagne', city: 'Saint-Malo', latitude: 48.6493, longitude: -2.0257 },
  produit: {
    name: 'Pull Marin Test', slug: 'atelier-test-pull-marin-test', priceMin: 89,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=640',
    externalBuyUrl: 'https://www.atelier-test.example/products/pull-marin',
    descriptionShort: 'Un pull marin en laine vierge tricoté en Bretagne, pour les tests de parcours.',
  },
  utilisateur: { email: 'visiteur@test.local', password: 'mot-de-passe-de-test-long', name: 'Visiteur Test' },
  /** Propriétaire déjà validé d'ATELIER TEST : le seul à pouvoir l'éditer dans le Studio. */
  proprietaire: { email: 'proprietaire@test.local', password: 'mot-de-passe-proprio-long', name: 'Propriétaire Test' },
  /** Le compte que le parcours d'inscription crée ; il n'existe pas avant. */
  inscrit: { email: 'nouveau@test.local', password: 'mot-de-passe-nouveau-long', name: 'Camille Nouveau', companyName: 'Atelier Test SAS' },
  admin: { email: 'admin@test.local', password: 'mot-de-passe-admin-long', name: 'Admin Test' },
} as const;
