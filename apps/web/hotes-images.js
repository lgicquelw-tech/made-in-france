// Les hôtes dont les images passent par l'optimiseur de Next (REBUILD.md T4.10, T8.9).
//
// UNE seule liste, lue par `next.config.js` (côté build) et par
// `src/lib/image-optimisable.ts` (côté rendu). Si elles divergeaient, `next/image`
// recevrait une image d'un hôte non déclaré et **ferait tomber la page entière** —
// c'est arrivé le 17 septembre 2026 avec le premier catalogue complet : 172 hôtes
// d'images différents, un par boutique WooCommerce.
//
// On n'ouvre pas `**` : l'optimiseur deviendrait un proxy d'images public. Les hôtes
// inconnus sont servis en `<img loading="lazy">`, sans optimisation.
//
// Fichier en JavaScript pur : `next.config.js` ne peut pas importer de TypeScript.

/** @type {{ protocol: 'https'; hostname: string; pathname?: string }[]} */
const HOTES_IMAGES = [
  // Logos dérivés du site de la marque, faute de logo fourni.
  { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons**' },
  // Médias envoyés depuis l'administration et le Studio.
  { protocol: 'https', hostname: 'res.cloudinary.com' },
  // Images produit collectées par les scrapers : 22 000 des 35 000 images.
  { protocol: 'https', hostname: 'cdn.shopify.com' },
  { protocol: 'https', hostname: '**.shopify.com' },
  // Boutiques WooCommerce hébergées chez WordPress.com.
  { protocol: 'https', hostname: '**.wp.com' },
  // Illustrations de démonstration.
  { protocol: 'https', hostname: 'images.unsplash.com' },
  // Vignettes de vidéos.
  { protocol: 'https', hostname: 'img.youtube.com' },
];

module.exports = { HOTES_IMAGES };
