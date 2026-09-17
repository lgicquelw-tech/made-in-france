const { HOTES_IMAGES } = require('./hotes-images');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Transpile workspace packages
  transpilePackages: ['@mif/shared'],
  
  // Images configuration
  images: {
    // Une seule liste, partagée avec `src/lib/image-optimisable.ts` : voir hotes-images.js.
    remotePatterns: HOTES_IMAGES,
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
