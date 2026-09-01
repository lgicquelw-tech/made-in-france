/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Transpile workspace packages
  transpilePackages: ['@mif/shared'],
  
  // Images configuration
  images: {
    // Hôtes réellement utilisés par le projet. Les trois hôtes déclarés
    // auparavant (AWS, Cloudflare, Unsplash) ne servaient à rien : aucune
    // image du projet n'en provient. Sans la bonne liste, `next/image`
    // refuse de servir l'image — c'est le prérequis de T4.10.
    remotePatterns: [
      // Logos dérivés du site de la marque, faute de logo fourni.
      { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons**' },
      // Médias envoyés depuis l'administration et le Studio.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Images produit collectées par les scrapers.
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.shopify.com' },
      // Boutiques WooCommerce : domaines quelconques, d'où le motif large.
      { protocol: 'https', hostname: '**.wp.com' },
      // Illustrations de démonstration encore présentes sur la page d'accueil.
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Vignettes de vidéos.
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/marque/:slug',
        destination: '/marques/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
