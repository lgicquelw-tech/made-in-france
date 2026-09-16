/**
 * Scraper WooCommerce — collecte les produits d'une boutique (API Store, sans clé)
 * et les confie au point d'écriture unique du catalogue (`scripts/catalogue/upsert.ts`).
 *
 * Ce fichier ne touche plus à `prisma.product` (REBUILD.md T5.3, T5.5, T5.6).
 *
 * Usage :
 *   npx tsx scripts/woocommerce-scraper.ts <slug-marque> <domaine>
 *   npx tsx scripts/woocommerce-scraper.ts --all
 */

import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { texteDepuisHtml } from './catalogue/html';
import { enregistrerCollecte, afficherBilan, type ProduitAEnregistrer } from './catalogue/upsert';

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
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
}

function createProductSlug(brandSlug: string, productSlug: string): string {
  return `${brandSlug}-${productSlug}`;
}

async function fetchWooProducts(domain: string): Promise<WooProduct[]> {
  const allProducts: WooProduct[] = [];
  let page = 1;
  const perPage = 100;

  console.log(`🔍 Fetching products from ${domain}...`);

  for (;;) {
    const url = `https://${domain}/wp-json/wc/store/products?per_page=${perPage}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (!response.ok) break;

      const products = (await response.json()) as WooProduct[];

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

/** Convertit un produit de l'API Store WooCommerce en produit à enregistrer. */
function convertir(brandSlug: string, p: WooProduct): ProduitAEnregistrer {
  // L'API Store exprime les prix en centimes, sous forme de chaîne.
  const prix = p.prices?.price ? Number.parseInt(p.prices.price, 10) / 100 : NaN;
  const longue = texteDepuisHtml(p.description);
  const courte = texteDepuisHtml(p.short_description) || longue;
  const images = (p.images ?? []).map((i) => i.src);

  return {
    externalSource: 'woocommerce',
    externalId: String(p.id),
    name: p.name,
    slug: createProductSlug(brandSlug, p.slug),
    descriptionShort: courte ? courte.slice(0, 500) : null,
    descriptionLong: longue || null,
    priceMin: Number.isFinite(prix) && prix > 0 ? prix : null,
    priceMax: Number.isFinite(prix) && prix > 0 ? prix : null,
    currency: p.prices?.currency_code || 'EUR',
    imageUrl: images[0] ?? null,
    galleryUrls: images,
    externalBuyUrl: p.permalink || null,
    externalData: JSON.stringify(p),
    type: (p.categories ?? []).map((c) => c.name).join(' / ') || null,
    tags: (p.tags ?? []).map((t) => t.name),
  };
}

async function importProducts(brandSlug: string, products: WooProduct[]): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug }, select: { id: true, name: true } });
  if (!brand) throw new Error(`Marque introuvable : ${brandSlug}`);

  const bilan = await enregistrerCollecte(prisma, brand.id, products.map((p) => convertir(brandSlug, p)));
  afficherBilan(brand.name, bilan);
}

async function importAllWooCommerce(): Promise<void> {
  console.log('🔍 Finding all WooCommerce brands...\n');

  // Toutes les marques avec un site — pas seulement celles « sans produit ». L'ancien
  // filtre `products: { none: {} }` empêchait toute mise à jour : une relance ne
  // repassait jamais sur une marque déjà importée, ce qui est l'inverse de
  // l'idempotence voulue par T5.5.
  const brands = await prisma.brand.findMany({
    where: { websiteUrl: { not: null } },
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
      // Un domaine injoignable n'est pas une boutique WooCommerce : on passe, mais
      // on le dit — une erreur avalée est une erreur qu'on ne peut pas corriger.
      process.stdout.write(`\n  ${brand.name} : ${error instanceof Error ? error.message : error}`);
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
