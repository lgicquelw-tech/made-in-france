const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fillLogos() {
  console.log('🔄 Récupération des marques avec websiteUrl...\n');
  
  const brands = await prisma.brand.findMany({
    where: {
      websiteUrl: { not: null },
      logoUrl: null,
    },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
    },
  });

  console.log(`📊 ${brands.length} marques à traiter\n`);

  let updated = 0;
  let errors = 0;

  for (const brand of brands) {
    try {
      const url = new URL(brand.websiteUrl);
      const domain = url.hostname.replace('www.', '');
      const logoUrl = `https://logo.clearbit.com/${domain}`;
      
      await prisma.brand.update({
        where: { id: brand.id },
        data: { logoUrl },
      });
      
      updated++;
      console.log(`✅ ${brand.name} → ${logoUrl}`);
    } catch (e) {
      errors++;
      console.log(`❌ ${brand.name} - URL invalide: ${brand.websiteUrl}`);
    }
  }

  console.log(`\n✨ Terminé ! ${updated} logos ajoutés, ${errors} erreurs`);
}

fillLogos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
