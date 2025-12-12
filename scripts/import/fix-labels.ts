import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function getColumnValue(row: Record<string, unknown>, searchKey: string): string | undefined {
  const normalizedSearch = normalizeColumnName(searchKey);
  for (const key of Object.keys(row)) {
    if (normalizeColumnName(key) === normalizedSearch) {
      const value = row[key];
      if (value !== null && value !== undefined) {
        return String(value).trim();
      }
    }
  }
  return undefined;
}

async function main() {
  console.log('\n🏷️  Ajout des labels aux marques\n');

  // Lire le fichier Excel
  const workbook = XLSX.readFile('../data/brands.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  console.log(`📊 ${data.length} lignes trouvées dans l'Excel\n`);

  // Récupérer les labels
  const labels = await prisma.label.findMany();
  const epvLabel = labels.find(l => l.slug === 'entreprise-du-patrimoine-vivant');
  const ofgLabel = labels.find(l => l.slug === 'origine-france-garantie');
  const artisanLabel = labels.find(l => l.slug === 'artisan');

  console.log('Labels trouvés:');
  console.log(`  - EPV: ${epvLabel?.id || 'NON TROUVÉ'}`);
  console.log(`  - OFG: ${ofgLabel?.id || 'NON TROUVÉ'}`);
  console.log(`  - Artisan: ${artisanLabel?.id || 'NON TROUVÉ'}`);
  console.log('');

  let epvCount = 0;
  let ofgCount = 0;
  let artisanCount = 0;
  let notFoundCount = 0;
  let processedCount = 0;

  for (const row of data) {
    const name = getColumnValue(row, 'nommarque') || getColumnValue(row, 'nom');
    if (!name) continue;

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`   Traitement ${processedCount}/${data.length}...`);
    }

    // Chercher la marque dans la base
    let brand = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!brand) {
      // Essayer avec le slug
      const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
      
      brand = await prisma.brand.findUnique({ where: { slug } });
    }

    if (!brand) {
      notFoundCount++;
      continue;
    }

    const brandId = brand.id;

    // Vérifier EPV
    const epvValue = getColumnValue(row, 'epv');
    if (epvValue && epvLabel && epvValue.toLowerCase() === 'oui') {
      try {
        await prisma.brandLabel.upsert({
          where: {
            brandId_labelId: { brandId, labelId: epvLabel.id }
          },
          create: { brandId, labelId: epvLabel.id },
          update: {},
        });
        epvCount++;
      } catch (e) {
        // Ignore les erreurs
      }
    }

    // Vérifier OFG
    const ofgValue = getColumnValue(row, 'ofg');
    if (ofgValue && ofgLabel && ofgValue.toLowerCase() === 'oui') {
      try {
        await prisma.brandLabel.upsert({
          where: {
            brandId_labelId: { brandId, labelId: ofgLabel.id }
          },
          create: { brandId, labelId: ofgLabel.id },
          update: {},
        });
        ofgCount++;
      } catch (e) {
        // Ignore les erreurs
      }
    }

    // Vérifier Artisan
    const artisanValue = getColumnValue(row, 'artisancma') || getColumnValue(row, 'artisan');
    if (artisanValue && artisanLabel && artisanValue.toLowerCase() === 'oui') {
      try {
        await prisma.brandLabel.upsert({
          where: {
            brandId_labelId: { brandId, labelId: artisanLabel.id }
          },
          create: { brandId, labelId: artisanLabel.id },
          update: {},
        });
        artisanCount++;
      } catch (e) {
        // Ignore les erreurs
      }
    }
  }

  console.log('\n✅ Résultat:');
  console.log(`   - EPV ajoutés: ${epvCount}`);
  console.log(`   - OFG ajoutés: ${ofgCount}`);
  console.log(`   - Artisan ajoutés: ${artisanCount}`);
  console.log(`   - Marques non trouvées: ${notFoundCount}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
