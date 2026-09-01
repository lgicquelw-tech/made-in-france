const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Pause entre les requêtes pour ne pas surcharger l'API
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeCity(city, region) {
  try {
    const query = encodeURIComponent(`${city}, ${region || 'France'}`);
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${query}&limit=1`);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error(`   Erreur API pour ${city}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🗺️  Géocodage des marques via API gouv.fr...\n');

  const brands = await prisma.brand.findMany({
    where: {
      city: { not: null },
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    include: {
      region: true,
    },
  });

  console.log(`   ${brands.length} marques à géocoder\n`);

  let updated = 0;
  let notFound = 0;

  for (const brand of brands) {
    if (!brand.city) continue;

    const coords = await geocodeCity(brand.city, brand.region?.name);
    
    if (coords) {
      await prisma.brand.update({
        where: { id: brand.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });
      updated++;
      if (updated % 20 === 0) {
        console.log(`   📍 ${updated} marques géocodées...`);
      }
    } else {
      notFound++;
      console.log(`   ⚠️  Non trouvé: ${brand.city} (${brand.name})`);
    }

    // Pause de 100ms entre chaque requête
    await sleep(100);
  }

  console.log(`\n✅ Géocodage terminé !`);
  console.log(`   - ${updated} marques mises à jour`);
  console.log(`   - ${notFound} villes non trouvées`);

  const withCoords = await prisma.brand.count({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
  });
  const total = await prisma.brand.count();

  console.log(`\n📊 ${withCoords}/${total} marques ont des coordonnées`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });