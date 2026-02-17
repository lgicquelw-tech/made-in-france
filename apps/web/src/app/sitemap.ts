import { MetadataRoute } from 'next';

const BASE_URL = 'https://madeinfrance.fr';

async function getBrands() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/brands?limit=1000');
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getRegions() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/regions');
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

const SECTORS = [
  'mode-accessoires',
  'maison-jardin',
  'gastronomie',
  'cosmetique',
  'enfance',
  'loisirs-sport',
  'animaux',
  'sante-nutrition',
  'high-tech',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const brands = await getBrands();
  const regions = await getRegions();

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/marques`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/secteurs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/regions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/carte`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Pages marques
  const brandPages: MetadataRoute.Sitemap = brands.map((brand: { slug: string }) => ({
    url: `${BASE_URL}/marques/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Pages secteurs
  const sectorPages: MetadataRoute.Sitemap = SECTORS.map((slug) => ({
    url: `${BASE_URL}/secteurs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Pages régions
  const regionPages: MetadataRoute.Sitemap = regions.map((region: { slug: string }) => ({
    url: `${BASE_URL}/regions/${region.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...brandPages, ...sectorPages, ...regionPages];
}