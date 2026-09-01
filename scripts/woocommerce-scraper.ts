/**
 * 🛒 WooCommerce Product Scraper for Made in France
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  prices: {
    price: string;
    regular_price: string;
    currency_code: string;
  };
  images: { id: number; src: string; alt: string }[];
  permalink: string;
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function createProductSlug(brandSlug: string, productSlug: string): string {
  return `${brandSlug}-${productSlug}`;
}

async function fetchWooProducts(domain: string): Promise<WooProduct[]> {
  const allProducts: WooProduct[] = [];
  let page = 1;
  const perPage = 100;

  console.log(`🔍 Fetching products from ${domain}...`);

  while (true) {
    const url = `https://${domain}/wp-json/wc/store/products?per_page=${perPage}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (!response.ok) break;

      const products: WooProduct[] = await response.json();

      if (products.length === 0) break;

      allProducts.push(...products);
      console.log(`   Page ${page}: ${products.length} produits`);

      if (products.length < perPage) break;

      page++;
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      break;
    }
  }

  console.log(`✅ Total: ${allProducts.length} produits récupérés`);
  return allProducts;
}

async function importProducts(brandSlug: string, products: WooProduct[]): Promise<void> {
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug }
  });

  if (!brand) {
    throw new Error(`Brand not found: ${brandSlug}`);
  }

  console.log(`\n📦 Importing ${products.length} products for ${brand.name}...`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const wooProduct of products) {
    try {
      const productSlug = createProductSlug(brandSlug, wooProduct.slug);
      const price = wooProduct.prices?.price ? parseFloat(wooProduct.prices.price) / 100 : null;
      const imageUrl = wooProduct.images?.[0]?.src || null;
      const galleryUrls = wooProduct.images?.map(img => img.src) || [];

      const productData = {
        name: wooProduct.name,
        slug: productSlug,
        descriptionShort: cleanHtml(wooProduct.short_description || wooProduct.description).substring(0, 500),
        descriptionLong: cleanHtml(wooProduct.description),
        priceMin: price,
        priceMax: price,
        imageUrl: imageUrl,
        galleryUrls: galleryUrls,
        brandId: brand.id,
        status: 'ACTIVE' as const,
        externalBuyUrl: wooProduct.permalink,
        externalId: wooProduct.id.toString(),
        externalSource: 'woocommerce',
        externalData: JSON.stringify(wooProduct)
      };

      const existingProduct = await prisma.product.findFirst({
        where: {
          brandId: brand.id,
          externalId: wooProduct.id.toString(),
          externalSource: 'woocommerce'
        }
      });

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData
        });
        updated++;
      } else {
        await prisma.product.create({
          data: productData
        });
        created++;
      }

      process.stdout.write('.');

    } catch (error) {
      console.error(`\n❌ Error importing "${wooProduct.name}":`, error);
      errors++;
    }
  }

  console.log(`\n\n✅ Import terminé!`);
  console.log(`   - Créés: ${created}`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Erreurs: ${errors}`);
}

async function importAllWooCommerce(): Promise<void> {
  console.log('🔍 Finding all WooCommerce brands...\n');

  const brands = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null },
      products: { none: {} }
    },
    select: { name: true, slug: true, websiteUrl: true }
  });

  let totalImported = 0;

  for (const brand of brands) {
    if (!brand.websiteUrl) continue;

    try {
      const domain = new URL(brand.websiteUrl).hostname.replace('www.', '');
      const testUrl = `https://${domain}/wp-json/wc/store/products?per_page=1`;
      
      const response = await fetch(testUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (response.ok) {
        console.log(`\n\n========== ${brand.name} ==========`);
        const products = await fetchWooProducts(domain);
        if (products.length > 0) {
          await importProducts(brand.slug, products);
          totalImported += products.length;
        }
      }
    } catch (error) {
      // Skip silently
    }
  }

  console.log(`\n\n🎉 Import total: ${totalImported} produits`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--all') {
    await importAllWooCommerce();
  } else if (args.length >= 2) {
    const [brandSlug, domain] = args;
    console.log(`\n🛒 WooCommerce Scraper\n`);
    console.log(`Brand: ${brandSlug}`);
    console.log(`Domain: ${domain}\n`);

    const products = await fetchWooProducts(domain);
    if (products.length > 0) {
      await importProducts(brandSlug, products);
    }
  } else {
    console.log(`
🛒 WooCommerce Scraper - Made in France

Usage:
  npx tsx scripts/woocommerce-scraper.ts <brand-slug> <domain>
  npx tsx scripts/woocommerce-scraper.ts --all

Examples:
  npx tsx scripts/woocommerce-scraper.ts le-jardin-spa lejardin-spa.fr
  npx tsx scripts/woocommerce-scraper.ts --all   # Import all WooCommerce brands
`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
