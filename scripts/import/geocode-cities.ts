import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&limit=1&type=municipality`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur géocodage pour ${city}:`, error);
    return null;
  }
}

// Pause pour éviter de surcharger l'API
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🗺️  Géocodage des villes\n');
  
  // Récupérer toutes les marques avec une ville mais sans coordonnées
  const brands = await prisma.brand.findMany({
    where: {
      city: { not: null },
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    select: {
      id: true,
      name: true,
      city: true,
    }
  });
  
  console.log(`📊 ${brands.length} marques à géocoder\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    
    if (!brand.city) continue;
    
    // Afficher la progression
    if ((i + 1) % 50 === 0) {
      console.log(`   Traitement ${i + 1}/${brands.length}...`);
    }
    
    const coords = await geocodeCity(brand.city);
    
    if (coords) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
        }
      });
      successCount++;
    } else {
      errorCount++;
      console.log(`   ⚠️  Impossible de géocoder: ${brand.name} (${brand.city})`);
    }
    
    // Pause de 100ms entre chaque requête pour ne pas surcharger l'API
    await sleep(100);
  }
  
  console.log('\n✅ Résultat:');
  console.log(`   - Géocodées: ${successCount}`);
  console.log(`   - Erreurs: ${errorCount}`);
  console.log('');
  
  await prisma.$disconnect();
}

main().catch(console.error);
