import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const totalBrands = await prisma.brand.count();
  const brandsWithProducts = await prisma.brand.count({
    where: { products: { some: {} } }
  });
  const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
  
  console.log('\n📊 Statistiques Made in France:\n');
  console.log(`   Marques total: ${totalBrands}`);
  console.log(`   Marques avec produits: ${brandsWithProducts}`);
  console.log(`   Marques sans produits: ${totalBrands - brandsWithProducts}`);
  console.log(`   Produits actifs: ${totalProducts}`);
  
  await prisma.$disconnect();
}
main();
