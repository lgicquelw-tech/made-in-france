import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWooCommerce(url: string): Promise<any> {
  try {
    // WooCommerce Store API (public, no auth needed)
    const storeApiUrl = `${url.replace(/\/$/, '')}/wp-json/wc/store/products?per_page=3`;
    
    const response = await fetch(storeApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response.ok) {
      return { api: 'store', data: await response.json() };
    }
    
    // Alternative: WooCommerce REST API v3 (might need auth)
    const restApiUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3/products?per_page=3`;
    const response2 = await fetch(restApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (response2.ok) {
      return { api: 'v3', data: await response2.json() };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function main() {
  // Trouver les marques WooCommerce
  const brands = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null },
      products: { none: {} }
    },
    select: { name: true, slug: true, websiteUrl: true },
    take: 200
  });

  console.log('🔍 Testing WooCommerce API on brands...\n');

  let found = 0;
  for (const brand of brands) {
    if (!brand.websiteUrl) continue;
    
    const result = await testWooCommerce(brand.websiteUrl);
    
    if (result && Array.isArray(result.data) && result.data.length > 0) {
      console.log(`✅ ${brand.name} (${brand.slug})`);
      console.log(`   API: ${result.api}`);
      console.log(`   Products: ${result.data.length}`);
      console.log(`   Example: ${result.data[0]?.name || 'N/A'}`);
      console.log('');
      found++;
      
      if (found >= 5) break; // Arrêter après 5 trouvés
    }
  }

  if (found === 0) {
    console.log('❌ Aucune marque WooCommerce avec API publique trouvée');
  }

  await prisma.$disconnect();
}

main();
