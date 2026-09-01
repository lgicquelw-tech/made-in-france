/**
 * 🛒 Shopify Product Scraper for Made in France
 * 
 * Ce script récupère automatiquement les produits des sites Shopify
 * et les importe dans la base de données Made in France.
 * 
 * Usage:
 *   npx tsx scripts/shopify-scraper.ts <brand-slug> <shopify-domain>
 * 
 * Exemple:
 *   npx tsx scripts/shopify-scraper.ts raptor-nutrition raptornutrition.fr
 */

import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

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

// Nettoyer le HTML pour avoir une description propre
function cleanHtml(html: string): string {
  if (!html) return '';
  
  return html
    // Supprimer les tags HTML
    .replace(/<[^>]*>/g, ' ')
    // Décoder les entités HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Supprimer les espaces multiples
    .replace(/\s+/g, ' ')
    // Supprimer le marqueur __TAB__
    .replace(/__TAB__/g, '')
    .trim();
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
  
  while (true) {
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
async function importProducts(brandSlug: string, products: ShopifyProduct[]): Promise<void> {
  // Trouver la marque
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
  
  for (const shopifyProduct of products) {
    try {
      const productSlug = createProductSlug(brandSlug, shopifyProduct.handle);
      
      // Prendre le prix de la première variante disponible
      const availableVariant = shopifyProduct.variants.find(v => v.available) || shopifyProduct.variants[0];
      const price = availableVariant ? parseFloat(availableVariant.price) : null;
      
      // Prendre la première image comme image principale
      const imageUrl = shopifyProduct.images[0]?.src || null;
      
      // Toutes les images pour la galerie (y compris la première)
      const galleryUrls = shopifyProduct.images.map(img => img.src);
      
      // Créer les données du produit
      const productData = {
        name: shopifyProduct.title,
        slug: productSlug,
        descriptionShort: cleanHtml(shopifyProduct.body_html).substring(0, 500),
        descriptionLong: cleanHtml(shopifyProduct.body_html),
        priceMin: price,
        priceMax: price,
        imageUrl: imageUrl,
        galleryUrls: galleryUrls, // <-- AJOUT: toutes les images
        brandId: brand.id,
        status: 'ACTIVE' as const, // actif par defaut (membre de l'enum ProductStatus)

        // Metadata Shopify (pour sync future)
        externalId: shopifyProduct.id.toString(),
        externalSource: 'shopify',
        externalData: JSON.stringify({
          handle: shopifyProduct.handle,
          vendor: shopifyProduct.vendor,
          product_type: shopifyProduct.product_type,
          tags: shopifyProduct.tags,
          variants: shopifyProduct.variants.map(v => ({
            id: v.id,
            title: v.title,
            price: v.price,
            sku: v.sku,
            available: v.available
          })),
          images: shopifyProduct.images.map(i => i.src),
          updated_at: shopifyProduct.updated_at
        })
      };
      
      // Upsert - créer ou mettre à jour
      const existingProduct = await prisma.product.findFirst({
        where: {
          brandId: brand.id,
          externalId: shopifyProduct.id.toString()
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
      console.error(`\n❌ Error importing "${shopifyProduct.title}":`, error);
      errors++;
    }
  }
  
  console.log(`\n\n✅ Import terminé!`);
  console.log(`   - Créés: ${created}`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Erreurs: ${errors}`);
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
async function scanForShopifySites(): Promise<void> {
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
      const url = new URL(brand.websiteUrl);
      const domain = url.hostname.replace('www.', '');
      
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
}

// Mettre à jour les galleryUrls depuis externalData existant
async function updateGalleryUrls(): Promise<void> {
  console.log('🔄 Updating galleryUrls from externalData...\n');
  
  const products = await prisma.product.findMany({
    where: {
      externalSource: 'shopify',
      externalData: { not: null }
    }
  });
  
  console.log(`Found ${products.length} Shopify products to update`);
  
  let updated = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      if (!product.externalData) continue;
      
      const externalData = JSON.parse(product.externalData as string);
      const images = externalData.images || [];
      
      if (images.length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            galleryUrls: images
          }
        });
        updated++;
        process.stdout.write('.');
      }
    } catch (error) {
      errors++;
      process.stdout.write('x');
    }
  }
  
  console.log(`\n\n✅ Update terminé!`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Erreurs: ${errors}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--scan') {
    // Mode scan: trouver tous les sites Shopify
    await scanForShopifySites();
  } else if (args[0] === '--update-gallery') {
    // Mode update: mettre à jour les galleryUrls depuis externalData
    await updateGalleryUrls();
  } else if (args.length >= 2) {
    // Mode import: importer les produits d'une marque
    const [brandSlug, domain] = args;
    
    console.log(`\n🛒 Shopify Scraper - Made in France\n`);
    console.log(`Brand: ${brandSlug}`);
    console.log(`Domain: ${domain}\n`);
    
    // Vérifier que c'est bien un site Shopify
    const isShopify = await isShopifySite(domain);
    if (!isShopify) {
      console.error(`❌ ${domain} n'est pas un site Shopify ou l'API n'est pas accessible`);
      process.exit(1);
    }
    
    // Récupérer et importer les produits
    const products = await fetchShopifyProducts(domain);
    
    if (products.length > 0) {
      await importProducts(brandSlug, products);
    } else {
      console.log('⚠️ Aucun produit trouvé');
    }
  } else {
    console.log(`
🛒 Shopify Scraper - Made in France

Usage:
  npx tsx scripts/shopify-scraper.ts <brand-slug> <domain>
  npx tsx scripts/shopify-scraper.ts --scan
  npx tsx scripts/shopify-scraper.ts --update-gallery

Exemples:
  npx tsx scripts/shopify-scraper.ts raptor-nutrition raptornutrition.fr
  npx tsx scripts/shopify-scraper.ts --scan            # Trouver tous les sites Shopify
  npx tsx scripts/shopify-scraper.ts --update-gallery  # Mettre à jour les galleryUrls existantes

Options:
  --scan            Scanner toutes les marques pour détecter les sites Shopify
  --update-gallery  Mettre à jour galleryUrls depuis externalData (pour produits déjà importés)
`);
  }
  
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
