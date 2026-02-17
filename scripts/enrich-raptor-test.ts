// Test enrichissement Raptor Nutrition
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = ['vetements-homme', 'vetements-femme', 'chaussures', 'accessoires', 'maroquinerie', 'bijoux', 'cosmetiques', 'alimentation', 'maison-decoration', 'enfant-bebe', 'sport-loisirs', 'high-tech', 'nutrition-sport', 'complements-alimentaires', 'autres'];
const PRICE_RANGES = ['budget', 'moyen', 'premium', 'luxe'];
const TARGETS = ['homme', 'femme', 'mixte', 'enfant', 'sportif'];

async function enrichProduct(product: any, brand: any) {
  const prompt = `Tu es un expert en nutrition sportive et produits Made in France. Analyse ce produit Raptor Nutrition et genere des metadonnees PRECISES.

PRODUIT:
- Nom: ${product.name}
- Description: ${product.descriptionShort || 'Non disponible'}
- Prix: ${product.priceMin ? product.priceMin + ' euros' : 'Non disponible'}

MARQUE:
- Nom: ${brand.name}
- Description: ${brand.descriptionShort || 'Marque francaise de nutrition sportive'}

IMPORTANT: Sois PRECIS. Si c'est une whey, mets "whey" dans les tags. Si c'est un gainer, mets "gainer". Analyse bien le nom du produit.

Reponds UNIQUEMENT avec un JSON valide (pas de markdown) :
{
  "category": "une de: ${CATEGORIES.join(', ')}",
  "subcategory": "precise: whey, gainer, creatine, bcaa, pre-workout, snack-proteine, barres, accessoire, etc.",
  "tags": ["4-6 tags PRECIS parmi: proteine, whey, isolat, gainer, creatine, bcaa, pre-workout, post-workout, vegan, bio, musculation, endurance, recuperation, performance, perte-poids, prise-masse, energie, sans-gluten, sans-lactose, haute-teneur-proteine"],
  "target": "un de: ${TARGETS.join(', ')}",
  "priceRange": "un de: ${PRICE_RANGES.join(', ')} (budget=<30, moyen=30-60, premium=60-100, luxe=>100)",
  "ingredients": ["ingredients/composants principaux identifiables"],
  "usage": ["moments utilisation: pre-entrainement, post-entrainement, collation, petit-dejeuner, recuperation, quotidien"],
  "benefits": ["2-3 benefices cles: prise de masse, recuperation musculaire, energie, etc."],
  "sellingPoints": ["2-3 arguments de vente courts et percutants"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.2,
    });
    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('   Reponse brute:', content.substring(0, 200));
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('   Erreur API:', error.message);
    return null;
  }
}

async function main() {
  console.log('Test enrichissement RAPTOR NUTRITION\n');
  
  const brand = await prisma.brand.findFirst({
    where: { name: { contains: 'Raptor', mode: 'insensitive' } },
    include: { sector: true }
  });
  
  if (!brand) {
    console.log('Marque Raptor Nutrition non trouvee');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Marque trouvee:', brand.name);
  console.log('Description:', (brand.descriptionShort || '').substring(0, 150) + '...\n');
  
  const products = await prisma.product.findMany({
    where: { brandId: brand.id, status: 'ACTIVE' },
    take: 10,
    orderBy: { priceMin: 'desc' }
  });
  
  console.log(products.length, 'produits trouves\n');
  
  for (const product of products) {
    console.log('========================================');
    console.log('Produit:', product.name);
    console.log('Prix:', product.priceMin ? product.priceMin + ' EUR' : 'N/A');
    console.log('Desc:', (product.descriptionShort || 'Pas de description').substring(0, 120));
    
    const enrichment = await enrichProduct(product, brand);
    
    if (enrichment) {
      console.log('\nENRICHISSEMENT:');
      console.log('Categorie:', enrichment.category);
      console.log('Sous-cat:', enrichment.subcategory);
      console.log('Tags:', enrichment.tags?.join(', '));
      console.log('Cible:', enrichment.target);
      console.log('Gamme:', enrichment.priceRange);
      console.log('Ingredients:', enrichment.ingredients?.join(', ') || 'N/A');
      console.log('Usage:', enrichment.usage?.join(', '));
      console.log('Benefices:', enrichment.benefits?.join(', '));
      console.log('Arguments:', enrichment.sellingPoints?.join(' | '));
    } else {
      console.log('\nEchec enrichissement');
    }
    
    console.log('');
    await new Promise(r => setTimeout(r, 600));
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
