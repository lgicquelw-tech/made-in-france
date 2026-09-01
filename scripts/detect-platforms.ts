import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detectPlatform(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);
    
    const html = await response.text();
    
    // Détection des plateformes
    if (html.includes('Shopify.shop') || html.includes('cdn.shopify.com')) return 'shopify';
    if (html.includes('woocommerce') || html.includes('wp-content/plugins/woocommerce')) return 'woocommerce';
    if (html.includes('prestashop') || html.includes('PrestaShop')) return 'prestashop';
    if (html.includes('magento') || html.includes('Magento')) return 'magento';
    if (html.includes('bigcommerce')) return 'bigcommerce';
    if (html.includes('squarespace')) return 'squarespace';
    if (html.includes('wix.com')) return 'wix';
    if (html.includes('etsy.com')) return 'etsy';
    
    return 'unknown';
  } catch (error) {
    return 'error';
  }
}

async function main() {
  console.log('🔍 Detecting e-commerce platforms...\n');

  // Marques sans produits
  const brandsWithoutProducts = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null },
      products: { none: {} }
    },
    select: { id: true, name: true, websiteUrl: true },
    take: 100 // Tester sur 100 marques
  });

  console.log(`Testing ${brandsWithoutProducts.length} brands without products...\n`);

  const platforms: Record<string, string[]> = {};

  for (const brand of brandsWithoutProducts) {
    if (!brand.websiteUrl) continue;
    
    const platform = await detectPlatform(brand.websiteUrl);
    
    if (!platforms[platform]) platforms[platform] = [];
    platforms[platform].push(brand.name);
    
    process.stdout.write(platform === 'unknown' ? '.' : platform.charAt(0).toUpperCase());
  }

  console.log('\n\n📊 Résultats:\n');
  for (const [platform, brands] of Object.entries(platforms).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${platform}: ${brands.length} marques`);
    if (platform !== 'unknown' && platform !== 'error' && brands.length <= 10) {
      brands.forEach(b => console.log(`  - ${b}`));
    }
  }

  await prisma.$disconnect();
}

main();
