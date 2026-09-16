/**
 * Scraper Shopify — collecte les produits d'une boutique et les confie au point
 * d'écriture unique du catalogue (`scripts/catalogue/upsert.ts`).
 *
 * Ce fichier ne touche plus à `prisma.product`. Il récupère, convertit, et appelle
 * `enregistrerCollecte`, qui filtre le bruit, dédoublonne, retrouve la fiche par sa
 * clé stable et n'écrase jamais un champ éditorial (REBUILD.md T5.3, T5.5, T5.6).
 *
 * Usage :
 *   npx tsx scripts/shopify-scraper.ts <slug-marque> <domaine>   une marque
 *   npx tsx scripts/shopify-scraper.ts --scan                     détecter les boutiques
 *   npx tsx scripts/shopify-scraper.ts --all                      détecter ET importer
 */

import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { texteDepuisHtml } from './catalogue/html';
import { enregistrerCollecte, afficherBilan, type ProduitAEnregistrer } from './catalogue/upsert';

const prisma = new PrismaClient();

// Types pour l'API Shopify
interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image?: {
    src: string;
  };
}

interface ShopifyImage {
  id: number;
  src: string;
  width: number;
  height: number;
  position: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  published_at: string;
  created_at: string;
  updated_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}


// Créer un slug unique pour le produit
function createProductSlug(brandSlug: string, productHandle: string): string {
  return `${brandSlug}-${productHandle}`;
}

// Récupérer les produits depuis l'API Shopify
async function fetchShopifyProducts(domain: string): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250; // Max Shopify permet
  
  console.log(`🔍 Fetching products from ${domain}...`);
  
  for (;;) {
    const url = `https://${domain}/products.json?limit=${limit}&page=${page}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Essayer l'URL alternative
          const altUrl = `https://${domain}/collections/all/products.json?limit=${limit}&page=${page}`;
          const altResponse = await fetch(altUrl);
          
          if (!altResponse.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          
          const altData = (await altResponse.json()) as ShopifyResponse;
          if (altData.products.length === 0) break;
          allProducts.push(...altData.products);
        } else {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
      } else {
        const data = (await response.json()) as ShopifyResponse;
        
        if (data.products.length === 0) break;
        
        allProducts.push(...data.products);
        console.log(`   Page ${page}: ${data.products.length} produits`);
        
        if (data.products.length < limit) break;
      }
      
      page++;
      
      // Rate limiting - attendre 500ms entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`✅ Total: ${allProducts.length} produits récupérés`);
  return allProducts;
}

// Importer les produits dans la base de données
/**
 * Convertit un produit Shopify en produit à enregistrer.
 *
 * Le lien d'achat est **construit** depuis le domaine et la poignée : l'ancien
 * scraper ne le renseignait jamais, et tout produit Shopify arrivait sans bouton
 * d'achat. La description brute est gardée dans `externalData` pour qu'une
 * amélioration côté marchand reste accessible sans toucher au champ éditorial.
 */
function convertir(brandSlug: string, domain: string, p: ShopifyProduct): ProduitAEnregistrer {
  const variantes = p.variants ?? [];
  const prix = variantes
    .map((v) => Number.parseFloat(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const description = texteDepuisHtml(p.body_html);
  const images = (p.images ?? []).map((i) => i.src);

  return {
    externalSource: 'shopify',
    externalId: String(p.id),
    name: p.title,
    slug: createProductSlug(brandSlug, p.handle),
    descriptionShort: description ? description.slice(0, 500) : null,
    descriptionLong: description || null,
    priceMin: prix.length ? Math.min(...prix) : null,
    priceMax: prix.length ? Math.max(...prix) : null,
    currency: 'EUR',
    imageUrl: images[0] ?? null,
    galleryUrls: images,
    externalBuyUrl: `https://${domain}/products/${p.handle}`,
    externalData: JSON.stringify({
      handle: p.handle,
      vendor: p.vendor,
      product_type: p.product_type,
      tags: p.tags,
      body_html: p.body_html,
      variants: variantes.map((v) => ({ id: v.id, title: v.title, price: v.price, sku: v.sku, available: v.available })),
      images,
      updated_at: p.updated_at,
    }),
    type: p.product_type,
    tags: p.tags,
  };
}

async function importProducts(brandSlug: string, domain: string, products: ShopifyProduct[]): Promise<void> {
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug }, select: { id: true, name: true } });
  if (!brand) throw new Error(`Marque introuvable : ${brandSlug}`);

  const bilan = await enregistrerCollecte(prisma, brand.id, products.map((p) => convertir(brandSlug, domain, p)));
  afficherBilan(brand.name, bilan);
}

// Vérifier si un site est Shopify
async function isShopifySite(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}/products.json?limit=1`);
    if (response.ok) {
      const data = (await response.json()) as Record<string, unknown>;
      return 'products' in data;
    }
    return false;
  } catch {
    return false;
  }
}

// Scanner toutes les marques pour trouver les sites Shopify
async function scanForShopifySites(): Promise<{ name: string; slug: string; domain: string }[]> {
  console.log('🔍 Scanning all brands for Shopify sites...\n');
  
  const brands = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true
    }
  });
  
  const shopifyBrands: { name: string; slug: string; domain: string }[] = [];
  
  for (const brand of brands) {
    if (!brand.websiteUrl) continue;
    
    try {
      // On garde le nom d'hôte tel que la marque le déclare, `www.` compris : c'est
      // lui qui sert à construire le lien d'achat, et un lien canonique vaut mieux
      // qu'un lien qui redirige.
      const domain = new URL(brand.websiteUrl).hostname;
      
      const isShopify = await isShopifySite(domain);
      
      if (isShopify) {
        shopifyBrands.push({
          name: brand.name,
          slug: brand.slug,
          domain
        });
        console.log(`✅ ${brand.name} (${domain})`);
      } else {
        process.stdout.write('.');
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      process.stdout.write('x');
    }
  }
  
  console.log(`\n\n📊 Résultat: ${shopifyBrands.length} sites Shopify trouvés sur ${brands.length} marques\n`);
  
  if (shopifyBrands.length > 0) {
    console.log('Sites Shopify détectés:');
    shopifyBrands.forEach(b => {
      console.log(`  - ${b.name}: ${b.domain}`);
      console.log(`    Command: npx tsx scripts/shopify-scraper.ts ${b.slug} ${b.domain}`);
    });
  }
  return shopifyBrands;
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--scan') {
    await scanForShopifySites();
  } else if (args[0] === '--all') {
    // Remplace `import-all-shopify.ts` et sa liste de 181 marques figée en dur :
    // la détection est refaite à chaque passage, sur les marques réellement en base.
    const boutiques = await scanForShopifySites();
    for (const b of boutiques) {
      try {
        const products = await fetchShopifyProducts(b.domain);
        if (products.length > 0) await importProducts(b.slug, b.domain, products);
      } catch (e) {
        console.error(`\n  ${b.name} : ${e instanceof Error ? e.message : e}`);
      }
    }
  } else if (args.length >= 2) {
    const [brandSlug, domain] = args;
    console.log(`\nShopify — ${brandSlug} (${domain})`);
    if (!(await isShopifySite(domain))) {
      console.error(`${domain} n'est pas une boutique Shopify, ou son API n'est pas accessible`);
      process.exit(1);
    }
    const products = await fetchShopifyProducts(domain);
    if (products.length > 0) await importProducts(brandSlug, domain, products);
    else console.log('Aucun produit trouvé');
  } else {
    console.log(`
Usage :
  npx tsx scripts/shopify-scraper.ts <slug-marque> <domaine>
  npx tsx scripts/shopify-scraper.ts --scan     détecter les boutiques Shopify
  npx tsx scripts/shopify-scraper.ts --all      détecter et importer toutes les boutiques
`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
