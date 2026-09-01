// Enrichissement et SAUVEGARDE des produits Raptor Nutrition
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function enrichProduct(product: any, brand: any) {
  const prompt = `Tu es un expert en nutrition sportive. Analyse ce produit Raptor Nutrition.

PRODUIT:
- Nom: ${product.name}
- Description: ${product.descriptionShort || 'Non disponible'}
- Prix: ${product.priceMin ? product.priceMin + ' euros' : 'Non disponible'}

MARQUE: ${brand.name} - ${brand.descriptionShort || 'Nutrition sportive francaise'}

Reponds UNIQUEMENT avec un JSON valide :
{
  "tags": ["4-6 tags: proteine, whey, gainer, creatine, bcaa, pre-workout, barres, vitamines, minerals, omega3, recuperation, performance, prise-masse, seche, energie, vegan, sans-gluten, sans-lactose, femme, homme, debutant, confirme"],
  "materials": ["ingredients principaux du produit"],
  "benefits": ["3 benefices cles courts"],
  "sellingPoints": ["2-3 arguments de vente percutants"],
  "target": "homme/femme/mixte/sportif",
  "priceRange": "budget/moyen/premium/luxe",
  "usage": ["moments: pre-entrainement, post-entrainement, collation, quotidien"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
    });
    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('Erreur API:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== ENRICHISSEMENT RAPTOR NUTRITION ===\n');
  
  const brand = await prisma.brand.findFirst({
    where: { name: { contains: 'Raptor', mode: 'insensitive' } },
    include: { sector: true }
  });
  
  if (!brand) {
    console.log('Marque non trouvee');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Marque:', brand.name);
  
  const products = await prisma.product.findMany({
    where: { brandId: brand.id, status: 'ACTIVE' }
  });
  
  console.log('Produits a enrichir:', products.length, '\n');
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`[${i+1}/${products.length}] ${product.name.substring(0, 40)}...`);
    
    const enrichment = await enrichProduct(product, brand);
    
    if (enrichment) {
      // Sauvegarder en base
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
      console.log('   -> Sauvegarde OK');
      success++;
    } else {
      console.log('   -> ECHEC');
      failed++;
    }
    
    // Pause anti rate-limit
    await new Promise(r => setTimeout(r, 400));
  }
  
  console.log('\n=== TERMINE ===');
  console.log('Succes:', success);
  console.log('Echecs:', failed);
  
  await prisma.$disconnect();
}

main().catch(console.error);
