import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWooCommerce(url: string): Promise<number | null> {
  try {
    const storeApiUrl = `${url.replace(/\/$/, '')}/wp-json/wc/store/products?per_page=1`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(storeApiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const total = response.headers.get('X-WP-Total');
      return total ? parseInt(total) : 0;
    }
    
    return null;
  } catch (error) {
    return null;
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

  console.log('🔍 Scanning WooCommerce APIs...\n');

  const wooCommerceBrands: { name: string; slug: string; domain: string; productCount: number }[] = [];

  for (const brand of brands) {
    if (!brand.websiteUrl) continue;
    
    const productCount = await testWooCommerce(brand.websiteUrl);
    
    if (productCount !== null && productCount > 0) {
      const domain = new URL(brand.websiteUrl).hostname.replace('www.', '');
      wooCommerceBrands.push({ 
        name: brand.name, 
        slug: brand.slug, 
        domain,
        productCount 
      });
      console.log(`✅ ${brand.name}: ${productCount} produits`);
    } else {
      process.stdout.write('.');
    }
  }

  console.log(`\n\n📊 Résumé: ${wooCommerceBrands.length} marques WooCommerce avec API accessible\n`);
  
  const totalProducts = wooCommerceBrands.reduce((sum, b) => sum + b.productCount, 0);
  console.log(`📦 Total produits potentiels: ${totalProducts}\n`);

  await prisma.$disconnect();
}

main();
