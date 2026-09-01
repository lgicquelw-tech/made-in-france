import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRANDS_PER_RUN = 20;
const DELAY_MS = 300;

async function enrichProduct(product: any, brand: any) {
  const productInfo = [
    "Produit: " + product.name,
    "Description: " + (product.descriptionShort || "Non disponible"),
    "Prix: " + (product.priceMin ? product.priceMin + " EUR" : "Non disponible"),
    "Marque: " + brand.name,
    "Secteur: " + (brand.sector?.name || "Non specifie")
  ].join(" | ");

  const prompt = "Analyse ce produit Made in France et genere des metadonnees. " + productInfo + " --- Reponds UNIQUEMENT avec un JSON valide sans markdown: {\"tags\":[\"4-6 tags pertinents\"],\"materials\":[\"materiaux ou ingredients\"],\"benefits\":[\"2-3 benefices\"],\"sellingPoints\":[\"2-3 arguments de vente\"],\"target\":\"homme ou femme ou mixte ou enfant ou sportif\",\"priceRange\":\"budget ou moyen ou premium ou luxe\",\"usage\":[\"moments utilisation\"]}";

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.2,
    });
    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    return null;
  }
}

async function main() {
  console.log('=== ENRICHISSEMENT DE 20 MARQUES ===\n');
  
  // Trouver les marques avec des produits non enrichis
  const brandsWithUnenriched = await prisma.brand.findMany({
    where: {
      status: 'ACTIVE',
      products: {
        some: {
          status: 'ACTIVE',
          tags: { equals: [] }
        }
      }
    },
    include: {
      sector: true,
      _count: {
        select: {
          products: {
            where: { status: 'ACTIVE', tags: { equals: [] } }
          }
        }
      }
    },
    take: BRANDS_PER_RUN,
    orderBy: { name: 'asc' }
  });
  
  if (brandsWithUnenriched.length === 0) {
    console.log('Toutes les marques sont enrichies!');
    await prisma.$disconnect();
    return;
  }
  
  // Stats globales
  const totalBrandsRemaining = await prisma.brand.count({
    where: {
      status: 'ACTIVE',
      products: { some: { status: 'ACTIVE', tags: { equals: [] } } }
    }
  });
  
  console.log('Marques restantes a enrichir:', totalBrandsRemaining);
  console.log('Marques dans ce batch:', brandsWithUnenriched.length);
  console.log('');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < brandsWithUnenriched.length; i++) {
    const brand = brandsWithUnenriched[i];
    
    console.log('----------------------------------------');
    console.log('[' + (i + 1) + '/' + brandsWithUnenriched.length + '] ' + brand.name);
    console.log('Secteur:', brand.sector?.name || 'N/A');
    
    // Charger les produits non enrichis de cette marque
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        status: 'ACTIVE',
        tags: { equals: [] }
      }
    });
    
    console.log('Produits a enrichir:', products.length);
    
    let success = 0;
    let failed = 0;
    
    for (const product of products) {
      const enrichment = await enrichProduct(product, brand);
      
      if (enrichment) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            tags: enrichment.tags || [],
            materials: enrichment.materials || [],
            aiSellingPoints: enrichment.sellingPoints || [],
            attributes: {
              benefits: enrichment.benefits || [],
              target: enrichment.target || 'mixte',
              priceRange: enrichment.priceRange || 'moyen',
              usage: enrichment.usage || []
            }
          }
        });
        success++;
        process.stdout.write('.');
      } else {
        failed++;
        process.stdout.write('x');
      }
      
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    
    console.log(' OK (' + success + '/' + products.length + ')');
    totalSuccess += success;
    totalFailed += failed;
  }
  
  console.log('\n========================================');
  console.log('BATCH TERMINE!');
  console.log('Marques traitees:', brandsWithUnenriched.length);
  console.log('Produits enrichis:', totalSuccess);
  console.log('Echecs:', totalFailed);
  console.log('');
  console.log('Marques restantes:', totalBrandsRemaining - brandsWithUnenriched.length);
  console.log('');
  console.log('Relance le script pour continuer avec les 20 prochaines marques!');
  
  await prisma.$disconnect();
}

main().catch(console.error);
