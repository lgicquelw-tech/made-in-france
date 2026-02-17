import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function isShopify(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    return html.includes('Shopify.shop') || html.includes('cdn.shopify.com');
  } catch {
    return false;
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

  console.log('🔍 Finding Shopify brands without products...\n');

  for (const brand of brands) {
    if (!brand.websiteUrl) continue;
    if (await isShopify(brand.websiteUrl)) {
      const domain = new URL(brand.websiteUrl).hostname.replace('www.', '');
      console.log(`npx tsx scripts/shopify-scraper.ts ${brand.slug} ${domain}`);
    }
  }

  await prisma.$disconnect();
}
main();
