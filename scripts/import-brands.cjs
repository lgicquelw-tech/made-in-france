const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// Fonction pour créer un slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Mapping des secteurs avec couleurs
const SECTORS_DATA = [
  { name: 'Mode & Accessoires', slug: 'mode-accessoires', color: '#3B82F6', icon: '👗' },
  { name: 'Maison & Jardin', slug: 'maison-jardin', color: '#10B981', icon: '🏠' },
  { name: 'Gastronomie', slug: 'gastronomie', color: '#F59E0B', icon: '🍽️' },
  { name: 'Cosmétique', slug: 'cosmetique', color: '#EC4899', icon: '✨' },
  { name: 'Enfance', slug: 'enfance', color: '#8B5CF6', icon: '🧸' },
  { name: 'Loisirs & Sport', slug: 'loisirs-sport', color: '#06B6D4', icon: '⚽' },
  { name: 'Animaux', slug: 'animaux', color: '#8B4513', icon: '🐾' },
  { name: 'Santé & Nutrition', slug: 'sante-nutrition', color: '#22C55E', icon: '💚' },
  { name: 'High-Tech', slug: 'high-tech', color: '#6366F1', icon: '💻' },
];

// Régions de France
const REGIONS_DATA = [
  { name: 'Île-de-France', slug: 'ile-de-france', centerLat: 48.8566, centerLng: 2.3522 },
  { name: 'Auvergne-Rhône-Alpes', slug: 'auvergne-rhone-alpes', centerLat: 45.7640, centerLng: 4.8357 },
  { name: 'Nouvelle-Aquitaine', slug: 'nouvelle-aquitaine', centerLat: 44.8378, centerLng: -0.5792 },
  { name: 'Occitanie', slug: 'occitanie', centerLat: 43.6047, centerLng: 1.4442 },
  { name: 'Hauts-de-France', slug: 'hauts-de-france', centerLat: 49.8941, centerLng: 2.2958 },
  { name: 'Provence-Alpes-Côte d\'Azur', slug: 'provence-alpes-cote-d-azur', centerLat: 43.9352, centerLng: 6.0679 },
  { name: 'Grand Est', slug: 'grand-est', centerLat: 48.5734, centerLng: 7.7521 },
  { name: 'Pays de la Loire', slug: 'pays-de-la-loire', centerLat: 47.2184, centerLng: -1.5536 },
  { name: 'Bretagne', slug: 'bretagne', centerLat: 48.1173, centerLng: -1.6778 },
  { name: 'Normandie', slug: 'normandie', centerLat: 49.1829, centerLng: -0.3707 },
  { name: 'Bourgogne-Franche-Comté', slug: 'bourgogne-franche-comte', centerLat: 47.2805, centerLng: 4.9994 },
  { name: 'Centre-Val de Loire', slug: 'centre-val-de-loire', centerLat: 47.7516, centerLng: 1.6751 },
  { name: 'Corse', slug: 'corse', centerLat: 42.0396, centerLng: 9.0129 },
];

async function main() {
  console.log('🚀 Début de l\'import des marques...\n');

  // 1. Créer les secteurs
  console.log('📦 Création des secteurs...');
  for (const sector of SECTORS_DATA) {
    await prisma.sector.upsert({
      where: { slug: sector.slug },
      update: { color: sector.color, icon: sector.icon },
      create: sector,
    });
  }
  console.log(`   ✅ ${SECTORS_DATA.length} secteurs créés\n`);

  // 2. Créer les régions
  console.log('🗺️  Création des régions...');
  for (const region of REGIONS_DATA) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: {},
      create: region,
    });
  }
  console.log(`   ✅ ${REGIONS_DATA.length} régions créées\n`);

  // 3. Charger le fichier Excel
  console.log('📊 Chargement du fichier Excel...');
  const filePath = path.join(__dirname, '../data/brands.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`   ✅ ${data.length} lignes trouvées\n`);

  // 4. Récupérer les secteurs et régions de la BDD
  const sectors = await prisma.sector.findMany();
  const regions = await prisma.region.findMany();

  const sectorMap = {};
  sectors.forEach(s => {
    sectorMap[s.name.toLowerCase()] = s.id;
    sectorMap[s.slug] = s.id;
  });

  const regionMap = {};
  regions.forEach(r => {
    regionMap[r.name.toLowerCase()] = r.id;
    regionMap[r.slug] = r.id;
  });

  // 5. Importer les marques
  console.log('🏭 Import des marques...');
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of data) {
    try {
      // Colonnes du fichier Excel
      const name = row['Nom Marque'];
      if (!name) {
        skipped++;
        continue;
      }

      // Convertir en string si c'est un nombre
      const nameStr = String(name);
      const slug = slugify(nameStr);
      
      // Trouver le secteur
      const sectorRaw = row['Secteur'] || '';
      const sectorId = sectorMap[sectorRaw.toLowerCase()] || null;

      // Trouver la région
      const regionRaw = row['Région'] || '';
      const regionId = regionMap[regionRaw.toLowerCase()] || null;

      // Social links
      const socialLinks = {};
      if (row['Instagram']) {
        socialLinks.instagram = row['Instagram'];
      }

      await prisma.brand.upsert({
        where: { slug },
        update: {
          name: nameStr,
          descriptionShort: row['Description'] || null,
          websiteUrl: row['Website'] || null,
          city: row['Ville (Siège/Atelier)'] || null,
          sectorId,
          regionId,
          socialLinks,
          status: 'ACTIVE',
        },
        create: {
          name: nameStr,
          slug,
          descriptionShort: row['Description'] || null,
          websiteUrl: row['Website'] || null,
          city: row['Ville (Siège/Atelier)'] || null,
          sectorId,
          regionId,
          socialLinks,
          status: 'ACTIVE',
        },
      });

      imported++;
      if (imported % 100 === 0) {
        console.log(`   📍 ${imported} marques importées...`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Erreur pour ${row['Nom Marque'] || 'inconnu'}: ${error.message}`);
    }
  }

  console.log(`\n✅ Import terminé !`);
  console.log(`   - ${imported} marques importées`);
  console.log(`   - ${skipped} lignes ignorées`);
  console.log(`   - ${errors} erreurs`);

  // Stats finales
  const totalBrands = await prisma.brand.count();
  const totalSectors = await prisma.sector.count();
  const totalRegions = await prisma.region.count();

  console.log(`\n📊 Statistiques finales :`);
  console.log(`   - ${totalBrands} marques en base`);
  console.log(`   - ${totalSectors} secteurs`);
  console.log(`   - ${totalRegions} régions`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });