import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Régions
  const regions = [
    { name: 'Auvergne-Rhône-Alpes', slug: 'auvergne-rhone-alpes' },
    { name: 'Bourgogne-Franche-Comté', slug: 'bourgogne-franche-comte' },
    { name: 'Bretagne', slug: 'bretagne' },
    { name: 'Centre-Val de Loire', slug: 'centre-val-de-loire' },
    { name: 'Corse', slug: 'corse' },
    { name: 'Grand Est', slug: 'grand-est' },
    { name: 'Hauts-de-France', slug: 'hauts-de-france' },
    { name: 'Île-de-France', slug: 'ile-de-france' },
    { name: 'Normandie', slug: 'normandie' },
    { name: 'Nouvelle-Aquitaine', slug: 'nouvelle-aquitaine' },
    { name: 'Occitanie', slug: 'occitanie' },
    { name: 'Pays de la Loire', slug: 'pays-de-la-loire' },
    { name: 'Provence-Alpes-Côte dAzur', slug: 'provence-alpes-cote-dazur' },
  ];

  for (const r of regions) {
    await prisma.region.upsert({ where: { slug: r.slug }, update: {}, create: r });
  }
  console.log('✅ 13 régions créées');

  // Secteurs
  const sectors = [
    { name: 'Mode & Accessoires', slug: 'mode-accessoires', color: '#3B82F6' },
    { name: 'Maison & Jardin', slug: 'maison-jardin', color: '#10B981' },
    { name: 'Gastronomie', slug: 'gastronomie', color: '#F59E0B' },
    { name: 'Cosmétique', slug: 'cosmetique', color: '#EC4899' },
    { name: 'Enfance', slug: 'enfance', color: '#8B5CF6' },
    { name: 'Loisirs & Sport', slug: 'loisirs-sport', color: '#06B6D4' },
    { name: 'Animaux', slug: 'animaux', color: '#8B4513' },
    { name: 'Santé & Nutrition', slug: 'sante-nutrition', color: '#22C55E' },
    { name: 'High-Tech', slug: 'high-tech', color: '#6366F1' },
  ];

  for (const s of sectors) {
    await prisma.sector.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  console.log('✅ 9 secteurs créés');

  // Labels
  const labels = [
    { name: 'Entreprise du Patrimoine Vivant', slug: 'epv' },
    { name: 'Origine France Garantie', slug: 'ofg' },
    { name: 'Artisan', slug: 'artisan' },
  ];

  for (const l of labels) {
    await prisma.label.upsert({ where: { slug: l.slug }, update: {}, create: l });
  }
  console.log('✅ 3 labels créés');

  await prisma.$disconnect();
  console.log('🎉 Seed terminé !');
}

seed();
