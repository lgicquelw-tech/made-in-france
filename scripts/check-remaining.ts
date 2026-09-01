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
    
    if (html.includes('Shopify.shop') || html.includes('cdn.shopify.com')) return 'shopify';
    if (html.includes('woocommerce') || html.includes('wp-content/plugins/woocommerce')) return 'woocommerce';
    if (html.includes('prestashop') || html.includes('PrestaShop')) return 'prestashop';
    if (html.includes('magento') || html.includes('Magento')) return 'magento';
    if (html.includes('wix.com')) return 'wix';
    if (html.includes('squarespace')) return 'squarespace';
    
    return 'unknown';
  } catch (error) {
    return 'error';
  }
}

async function main() {
  const brands = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null },
      products: { none: {} }
    },
    select: { name: true, slug: true, websiteUrl: true }
  });

  console.log(`\n🔍 Analysing ${brands.length} brands without products...\n`);

  const platforms: Record<string, number> = {};

  for (const brand of brands) {
    if (!brand.websiteUrl) continue;
    const platform = await detectPlatform(brand.websiteUrl);
    platforms[platform] = (platforms[platform] || 0) + 1;
    process.stdout.write(platform.charAt(0).toUpperCase());
  }

  console.log('\n\n📊 Plateformes des marques sans produits:\n');
  Object.entries(platforms)
    .sort((a, b) => b[1] - a[1])
    .forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count}`);
    });

  await prisma.$disconnect();
}
main();
