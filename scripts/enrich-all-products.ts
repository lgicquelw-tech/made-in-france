import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BATCH_SIZE = 100;
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
  console.log('=== ENRICHISSEMENT DE TOUS LES PRODUITS ===\n');
  
  const total = await prisma.product.count({ 
    where: { status: 'ACTIVE', tags: { equals: [] } } 
  });
  
  const alreadyDone = await prisma.product.count({ 
    where: { status: 'ACTIVE', NOT: { tags: { equals: [] } } } 
  });
  
  console.log('Deja enrichis:', alreadyDone);
  console.log('Restants a enrichir:', total);
  console.log('');
  
  if (total === 0) {
    console.log('Tous les produits sont deja enrichis!');
    await prisma.$disconnect();
    return;
  }
  
  let success = 0;
  let failed = 0;
  let batchNum = 0;
  
  while (true) {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', tags: { equals: [] } },
      include: { brand: { include: { sector: true } } },
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' }
    });
    
    if (products.length === 0) {
      console.log('\nTous les produits ont ete traites!');
      break;
    }
    
    batchNum++;
    console.log('Batch ' + batchNum + ' (' + products.length + ' produits)...');
    
    for (const product of products) {
      const enrichment = await enrichProduct(product, product.brand);
      
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
    
    const pct = ((success + failed) / total * 100).toFixed(1);
    console.log(' [' + pct + '%] Succes: ' + success + ' | Echecs: ' + failed);
  }
  
  console.log('\n=== TERMINE ===');
  console.log('Total traite:', success + failed);
  console.log('Succes:', success);
  console.log('Echecs:', failed);
  
  await prisma.$disconnect();
}

main().catch(console.error);
