import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Updating externalBuyUrl for Shopify products...\n');

  const products = await prisma.product.findMany({
    where: {
      externalSource: 'shopify',
      externalData: { not: null },
    },
    include: {
      brand: true,
    },
  });

  console.log(`Found ${products.length} Shopify products`);

  let updated = 0;
  let errors = 0;

  for (const product of products) {
    try {
      if (!product.externalData || !product.brand.websiteUrl) continue;

      const externalData = JSON.parse(product.externalData as string);
      const handle = externalData.handle;

      if (!handle) continue;

      // Construire l'URL d'achat
      const domain = new URL(product.brand.websiteUrl).hostname;
      const buyUrl = `https://${domain}/products/${handle}`;

      await prisma.product.update({
        where: { id: product.id },
        data: { externalBuyUrl: buyUrl },
      });

      updated++;
      process.stdout.write('.');
    } catch (error) {
      errors++;
      process.stdout.write('x');
    }
  }

  console.log(`\n\n✅ Update terminé!`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Erreurs: ${errors}`);

  await prisma.$disconnect();
}

main();
