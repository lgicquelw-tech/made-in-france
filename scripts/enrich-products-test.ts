// Script de test : enrichir 10 produits avec l'IA
// Usage: npx tsx scripts/enrich-products-test.ts

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Catégories possibles (à adapter selon ton modèle)
const CATEGORIES = [
  'vetements-homme',
  'vetements-femme',
  'chaussures',
  'accessoires',
  'maroquinerie',
  'bijoux',
  'cosmetiques',
  'alimentation',
  'maison-decoration',
  'enfant-bebe',
  'sport-loisirs',
  'high-tech',
  'autres'
];

const PRICE_RANGES = ['budget', 'moyen', 'premium', 'luxe'];
const TARGETS = ['homme', 'femme', 'mixte', 'enfant', 'bebe'];

async function enrichProduct(product: any, brand: any) {
  const prompt = `Tu es un expert en produits Made in France. Analyse ce produit et génère des métadonnées structurées.

PRODUIT:
- Nom: ${product.name}
- Description: ${product.description_short || 'Non disponible'}
- Prix: ${product.price_min ? `${product.price_min}€` : 'Non disponible'}

MARQUE:
- Nom: ${brand.name}
- Secteur: ${brand.sector?.name || 'Non spécifié'}
- Description: ${brand.description_short || 'Non disponible'}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte avant/après) :
{
  "category": "une des catégories: ${CATEGORIES.join(', ')}",
  "tags": ["3-5 tags pertinents en français, ex: artisanal, éco-responsable, luxe, casual, vintage, sport, bureau, soirée, quotidien, cadeau, intemporel"],
  "target": "un de: ${TARGETS.join(', ')}",
  "priceRange": "un de: ${PRICE_RANGES.join(', ')} (budget=<30€, moyen=30-100€, premium=100-300€, luxe=>300€)",
  "materials": ["matériaux principaux si identifiables, ex: cuir, coton, lin, laine, soie, bois, acier"],
  "occasions": ["1-3 occasions d'utilisation: quotidien, bureau, soirée, sport, weekend, cérémonie, voyage"],
  "sellingPoints": ["2-3 arguments de vente courts et percutants en français"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3, // Moins créatif, plus cohérent
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parser le JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ Pas de JSON valide pour ${product.name}`);
      return null;
    }
    
    const data = JSON.parse(jsonMatch[0]);
    return data;
  } catch (error) {
    console.error(`❌ Erreur pour ${product.name}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Test d\'enrichissement de 10 produits\n');
  
  // Récupérer 10 produits variés (différentes marques/prix)
  const products = await prisma.product.findMany({
    where: { 
      status: 'ACTIVE',
      tags: { equals: [] }, // Non encore enrichis
    },
    include: {
      brand: {
        include: { sector: true }
      }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📦 ${products.length} produits à enrichir\n`);

  const results = [];

  for (const product of products) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 ${product.name}`);
    console.log(`   Marque: ${product.brand.name}`);
    console.log(`   Prix: ${product.price_min ? `${product.price_min}€` : 'N/A'}`);
    console.log(`   Desc: ${(product.description_short || '').substring(0, 80)}...`);
    
    const enrichment = await enrichProduct(product, product.brand);
    
    if (enrichment) {
      console.log(`\n   ✅ Enrichissement généré:`);
      console.log(`   📁 Catégorie: ${enrichment.category}`);
      console.log(`   🏷️  Tags: ${enrichment.tags?.join(', ')}`);
      console.log(`   👤 Cible: ${enrichment.target}`);
      console.log(`   💰 Gamme: ${enrichment.priceRange}`);
      console.log(`   🧵 Matériaux: ${enrichment.materials?.join(', ') || 'N/A'}`);
      console.log(`   📅 Occasions: ${enrichment.occasions?.join(', ')}`);
      console.log(`   ⭐ Arguments: ${enrichment.sellingPoints?.join(' | ')}`);
      
      results.push({
        id: product.id,
        name: product.name,
        brand: product.brand.name,
        enrichment
      });
    }
    
    // Pause pour éviter le rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RÉSUMÉ: ${results.length}/10 produits enrichis avec succès`);
  
  // Sauvegarder les résultats pour review
  const fs = await import('fs');
  fs.writeFileSync(
    'enrichment-test-results.json', 
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 Résultats sauvegardés dans enrichment-test-results.json`);
  
  console.log(`\n⚠️  Ces données n'ont PAS été enregistrées en base.`);
  console.log(`   Vérifie les résultats et lance le script complet si OK.`);

  await prisma.$disconnect();
}

main().catch(console.error);
