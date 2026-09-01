import { PrismaClient, MadeInFranceLevel, BrandStatus, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ===========================================
  // REGIONS
  // ===========================================
  console.log('Creating regions...');
  
  const regions = await Promise.all([
    prisma.region.upsert({
      where: { slug: 'bretagne' },
      update: {},
      create: {
        name: 'Bretagne',
        slug: 'bretagne',
        centerLat: 48.2020,
        centerLng: -2.9326,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'normandie' },
      update: {},
      create: {
        name: 'Normandie',
        slug: 'normandie',
        centerLat: 49.1829,
        centerLng: -0.3707,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'ile-de-france' },
      update: {},
      create: {
        name: 'Île-de-France',
        slug: 'ile-de-france',
        centerLat: 48.8566,
        centerLng: 2.3522,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'provence-alpes-cote-dazur' },
      update: {},
      create: {
        name: "Provence-Alpes-Côte d'Azur",
        slug: 'provence-alpes-cote-dazur',
        centerLat: 43.9352,
        centerLng: 6.0679,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'auvergne-rhone-alpes' },
      update: {},
      create: {
        name: 'Auvergne-Rhône-Alpes',
        slug: 'auvergne-rhone-alpes',
        centerLat: 45.4473,
        centerLng: 4.3859,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'nouvelle-aquitaine' },
      update: {},
      create: {
        name: 'Nouvelle-Aquitaine',
        slug: 'nouvelle-aquitaine',
        centerLat: 45.7086,
        centerLng: 0.6262,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'occitanie' },
      update: {},
      create: {
        name: 'Occitanie',
        slug: 'occitanie',
        centerLat: 43.8927,
        centerLng: 3.2828,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'hauts-de-france' },
      update: {},
      create: {
        name: 'Hauts-de-France',
        slug: 'hauts-de-france',
        centerLat: 49.9662,
        centerLng: 2.7954,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'grand-est' },
      update: {},
      create: {
        name: 'Grand Est',
        slug: 'grand-est',
        centerLat: 48.6998,
        centerLng: 6.1878,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'pays-de-la-loire' },
      update: {},
      create: {
        name: 'Pays de la Loire',
        slug: 'pays-de-la-loire',
        centerLat: 47.4784,
        centerLng: -0.5632,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'centre-val-de-loire' },
      update: {},
      create: {
        name: 'Centre-Val de Loire',
        slug: 'centre-val-de-loire',
        centerLat: 47.7516,
        centerLng: 1.6751,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'bourgogne-franche-comte' },
      update: {},
      create: {
        name: 'Bourgogne-Franche-Comté',
        slug: 'bourgogne-franche-comte',
        centerLat: 47.2805,
        centerLng: 4.9994,
      },
    }),
    prisma.region.upsert({
      where: { slug: 'corse' },
      update: {},
      create: {
        name: 'Corse',
        slug: 'corse',
        centerLat: 42.0396,
        centerLng: 9.0129,
      },
    }),
  ]);

  console.log(`✅ Created ${regions.length} regions`);

  // ===========================================
  // SECTORS
  // ===========================================
  console.log('Creating sectors...');

  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { slug: 'mode' },
      update: {},
      create: {
        name: 'Mode',
        slug: 'mode',
        icon: 'shirt',
        color: '#8B5CF6',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'maison' },
      update: {},
      create: {
        name: 'Maison',
        slug: 'maison',
        icon: 'home',
        color: '#F59E0B',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'gastronomie' },
      update: {},
      create: {
        name: 'Gastronomie',
        slug: 'gastronomie',
        icon: 'utensils',
        color: '#EF4444',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'cosmetiques' },
      update: {},
      create: {
        name: 'Cosmétiques',
        slug: 'cosmetiques',
        icon: 'sparkles',
        color: '#EC4899',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'enfants' },
      update: {},
      create: {
        name: 'Enfants',
        slug: 'enfants',
        icon: 'baby',
        color: '#06B6D4',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'high-tech' },
      update: {},
      create: {
        name: 'High-Tech',
        slug: 'high-tech',
        icon: 'laptop',
        color: '#3B82F6',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'sport-loisirs' },
      update: {},
      create: {
        name: 'Sport & Loisirs',
        slug: 'sport-loisirs',
        icon: 'dumbbell',
        color: '#22C55E',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'jardin-exterieur' },
      update: {},
      create: {
        name: 'Jardin & Extérieur',
        slug: 'jardin-exterieur',
        icon: 'flower',
        color: '#84CC16',
      },
    }),
    prisma.sector.upsert({
      where: { slug: 'artisanat' },
      update: {},
      create: {
        name: 'Artisanat',
        slug: 'artisanat',
        icon: 'hammer',
        color: '#A16207',
      },
    }),
  ]);

  console.log(`✅ Created ${sectors.length} sectors`);

  // ===========================================
  // CATEGORIES
  // ===========================================
  console.log('Creating categories...');

  const modeSector = sectors.find(s => s.slug === 'mode')!;
  const maisonSector = sectors.find(s => s.slug === 'maison')!;
  const gastroSector = sectors.find(s => s.slug === 'gastronomie')!;
  const cosmetiquesSector = sectors.find(s => s.slug === 'cosmetiques')!;

  // Mode categories
  const modeCategories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'vetements' },
      update: {},
      create: { name: 'Vêtements', slug: 'vetements', sectorId: modeSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'chaussures' },
      update: {},
      create: { name: 'Chaussures', slug: 'chaussures', sectorId: modeSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'accessoires-mode' },
      update: {},
      create: { name: 'Accessoires', slug: 'accessoires-mode', sectorId: modeSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'maroquinerie' },
      update: {},
      create: { name: 'Maroquinerie', slug: 'maroquinerie', sectorId: modeSector.id, level: 0 },
    }),
  ]);

  // Maison categories
  const maisonCategories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'decoration' },
      update: {},
      create: { name: 'Décoration', slug: 'decoration', sectorId: maisonSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'mobilier' },
      update: {},
      create: { name: 'Mobilier', slug: 'mobilier', sectorId: maisonSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'linge-de-maison' },
      update: {},
      create: { name: 'Linge de maison', slug: 'linge-de-maison', sectorId: maisonSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'vaisselle' },
      update: {},
      create: { name: 'Vaisselle', slug: 'vaisselle', sectorId: maisonSector.id, level: 0 },
    }),
  ]);

  // Gastronomie categories
  const gastroCategories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'epicerie' },
      update: {},
      create: { name: 'Épicerie', slug: 'epicerie', sectorId: gastroSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'boissons' },
      update: {},
      create: { name: 'Boissons', slug: 'boissons', sectorId: gastroSector.id, level: 0 },
    }),
    prisma.category.upsert({
      where: { slug: 'produits-frais' },
      update: {},
      create: { name: 'Produits frais', slug: 'produits-frais', sectorId: gastroSector.id, level: 0 },
    }),
  ]);

  console.log(`✅ Created ${modeCategories.length + maisonCategories.length + gastroCategories.length} categories`);

  // ===========================================
  // LABELS
  // ===========================================
  console.log('Creating labels...');

  const labels = await Promise.all([
    prisma.label.upsert({
      where: { slug: 'origine-france-garantie' },
      update: {},
      create: {
        name: 'Origine France Garantie',
        slug: 'origine-france-garantie',
        description: 'Certification attestant que le produit tire ses caractéristiques essentielles de France.',
        websiteUrl: 'https://www.originefrancegarantie.fr',
      },
    }),
    prisma.label.upsert({
      where: { slug: 'entreprise-du-patrimoine-vivant' },
      update: {},
      create: {
        name: 'Entreprise du Patrimoine Vivant',
        slug: 'entreprise-du-patrimoine-vivant',
        description: 'Label distinguant les entreprises françaises aux savoir-faire artisanaux et industriels d\'excellence.',
        websiteUrl: 'https://www.patrimoine-vivant.com',
      },
    }),
    prisma.label.upsert({
      where: { slug: 'france-terre-textile' },
      update: {},
      create: {
        name: 'France Terre Textile',
        slug: 'france-terre-textile',
        description: 'Label garantissant qu\'au minimum 75% des opérations de production sont réalisées en France.',
        websiteUrl: 'https://www.franceterretextile.fr',
      },
    }),
    prisma.label.upsert({
      where: { slug: 'bio' },
      update: {},
      create: {
        name: 'Agriculture Biologique',
        slug: 'bio',
        description: 'Certification européenne de l\'agriculture biologique.',
      },
    }),
    prisma.label.upsert({
      where: { slug: 'eco-responsable' },
      update: {},
      create: {
        name: 'Éco-responsable',
        slug: 'eco-responsable',
        description: 'Marque engagée dans une démarche environnementale.',
      },
    }),
    prisma.label.upsert({
      where: { slug: 'artisan' },
      update: {},
      create: {
        name: 'Artisan',
        slug: 'artisan',
        description: 'Entreprise artisanale française.',
      },
    }),
  ]);

  console.log(`✅ Created ${labels.length} labels`);

  // ===========================================
  // SUBSCRIPTION PLANS
  // ===========================================
  console.log('Creating subscription plans...');

  await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.FREE },
      update: {},
      create: {
        tier: SubscriptionTier.FREE,
        name: 'Gratuit',
        description: 'Parfait pour démarrer et gagner en visibilité',
        priceMonthly: 0,
        priceYearly: 0,
        maxProducts: 5,
        maxTeamMembers: 1,
        hasAnalytics: false,
        hasAdvancedAnalytics: false,
        hasCampaigns: false,
        hasApiAccess: false,
        features: JSON.stringify([
          'Fiche marque complète',
          'Jusqu\'à 5 produits',
          'Présence sur la carte',
          'Référencement dans la recherche',
        ]),
        displayOrder: 0,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.STARTER },
      update: {},
      create: {
        tier: SubscriptionTier.STARTER,
        name: 'Starter',
        description: 'Pour les marques en croissance',
        priceMonthly: 29,
        priceYearly: 290,
        maxProducts: 25,
        maxTeamMembers: 2,
        hasAnalytics: true,
        hasAdvancedAnalytics: false,
        hasCampaigns: false,
        hasApiAccess: false,
        features: JSON.stringify([
          'Tout du plan Gratuit',
          'Jusqu\'à 25 produits',
          'Analytics de base',
          '2 membres d\'équipe',
          'Badge "Marque vérifiée"',
        ]),
        displayOrder: 1,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.STANDARD },
      update: {},
      create: {
        tier: SubscriptionTier.STANDARD,
        name: 'Standard',
        description: 'Pour les marques établies',
        priceMonthly: 79,
        priceYearly: 790,
        maxProducts: 100,
        maxTeamMembers: 5,
        hasAnalytics: true,
        hasAdvancedAnalytics: true,
        hasCampaigns: true,
        hasApiAccess: false,
        features: JSON.stringify([
          'Tout du plan Starter',
          'Jusqu\'à 100 produits',
          'Analytics avancés',
          '5 membres d\'équipe',
          'Campagnes sponsorisées',
          'Génération IA de descriptions',
        ]),
        isPopular: true,
        displayOrder: 2,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { tier: SubscriptionTier.PREMIUM },
      update: {},
      create: {
        tier: SubscriptionTier.PREMIUM,
        name: 'Premium',
        description: 'Pour les grandes marques',
        priceMonthly: 199,
        priceYearly: 1990,
        maxProducts: null, // Unlimited
        maxTeamMembers: null, // Unlimited
        hasAnalytics: true,
        hasAdvancedAnalytics: true,
        hasCampaigns: true,
        hasApiAccess: true,
        features: JSON.stringify([
          'Tout du plan Standard',
          'Produits illimités',
          'Équipe illimitée',
          'Accès API',
          'Support prioritaire',
          'Compte manager dédié',
        ]),
        displayOrder: 3,
      },
    }),
  ]);

  console.log('✅ Created 4 subscription plans');

  // ===========================================
  // SAMPLE BRANDS (for testing)
  // ===========================================
  console.log('Creating sample brands...');

  const bretagne = regions.find(r => r.slug === 'bretagne')!;
  const normandie = regions.find(r => r.slug === 'normandie')!;
  const idf = regions.find(r => r.slug === 'ile-de-france')!;

  const sampleBrands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'saint-james' },
      update: {},
      create: {
        name: 'Saint James',
        slug: 'saint-james',
        tagline: 'Le vrai pull marin depuis 1889',
        descriptionShort: 'Marque française emblématique de la marinière et du pull marin, fabriqués en Normandie depuis plus de 130 ans.',
        descriptionLong: 'Depuis 1889, Saint James perpétue le savoir-faire textile normand avec ses emblématiques marinières et pulls marins. Chaque pièce est tricotée dans les ateliers de Saint-James, en Normandie, avec une laine peignée de qualité supérieure.',
        regionId: normandie.id,
        city: 'Saint-James',
        postalCode: '50240',
        latitude: 48.5167,
        longitude: -1.3167,
        sectorId: modeSector.id,
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        yearFounded: 1889,
        websiteUrl: 'https://www.saint-james.com',
        socialLinks: { instagram: 'https://instagram.com/saintjames_officiel' },
        status: BrandStatus.ACTIVE,
        isVerified: true,
        isFeatured: true,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'armor-lux' },
      update: {},
      create: {
        name: 'Armor Lux',
        slug: 'armor-lux',
        tagline: 'Créateur textile breton depuis 1938',
        descriptionShort: 'Marque bretonne de vêtements marins et urbains, engagée pour une mode responsable et durable.',
        regionId: bretagne.id,
        city: 'Quimper',
        postalCode: '29000',
        latitude: 47.9960,
        longitude: -4.0999,
        sectorId: modeSector.id,
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        yearFounded: 1938,
        websiteUrl: 'https://www.armorlux.com',
        status: BrandStatus.ACTIVE,
        isVerified: true,
        isFeatured: true,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'le-slip-francais' },
      update: {},
      create: {
        name: 'Le Slip Français',
        slug: 'le-slip-francais',
        tagline: 'Sous-vêtements & vêtements Made in France',
        descriptionShort: 'Marque française de sous-vêtements et vêtements, fabriqués avec passion dans nos ateliers français.',
        regionId: idf.id,
        city: 'Paris',
        postalCode: '75011',
        latitude: 48.8566,
        longitude: 2.3522,
        sectorId: modeSector.id,
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        yearFounded: 2011,
        websiteUrl: 'https://www.leslipfrancais.fr',
        status: BrandStatus.ACTIVE,
        isVerified: true,
        isFeatured: true,
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'opinel' },
      update: {},
      create: {
        name: 'Opinel',
        slug: 'opinel',
        tagline: 'Le couteau savoyard depuis 1890',
        descriptionShort: 'Fabricant français de couteaux pliants iconiques, symboles du patrimoine artisanal savoyard.',
        regionId: regions.find(r => r.slug === 'auvergne-rhone-alpes')!.id,
        city: 'Chambéry',
        postalCode: '73000',
        sectorId: maisonSector.id,
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        yearFounded: 1890,
        websiteUrl: 'https://www.opinel.com',
        status: BrandStatus.ACTIVE,
        isVerified: true,
        isFeatured: true,
      },
    }),
  ]);

  console.log(`✅ Created ${sampleBrands.length} sample brands`);

  // Link brands to categories and labels
  const origineFrance = labels.find(l => l.slug === 'origine-france-garantie')!;
  const epv = labels.find(l => l.slug === 'entreprise-du-patrimoine-vivant')!;
  const vetementsCategory = modeCategories.find(c => c.slug === 'vetements')!;

  await Promise.all([
    // Saint James
    prisma.brandCategory.upsert({
      where: { brandId_categoryId: { brandId: sampleBrands[0].id, categoryId: vetementsCategory.id } },
      update: {},
      create: { brandId: sampleBrands[0].id, categoryId: vetementsCategory.id, isPrimary: true },
    }),
    prisma.brandLabel.upsert({
      where: { brandId_labelId: { brandId: sampleBrands[0].id, labelId: origineFrance.id } },
      update: {},
      create: { brandId: sampleBrands[0].id, labelId: origineFrance.id },
    }),
    prisma.brandLabel.upsert({
      where: { brandId_labelId: { brandId: sampleBrands[0].id, labelId: epv.id } },
      update: {},
      create: { brandId: sampleBrands[0].id, labelId: epv.id },
    }),
    // Armor Lux
    prisma.brandCategory.upsert({
      where: { brandId_categoryId: { brandId: sampleBrands[1].id, categoryId: vetementsCategory.id } },
      update: {},
      create: { brandId: sampleBrands[1].id, categoryId: vetementsCategory.id, isPrimary: true },
    }),
    prisma.brandLabel.upsert({
      where: { brandId_labelId: { brandId: sampleBrands[1].id, labelId: origineFrance.id } },
      update: {},
      create: { brandId: sampleBrands[1].id, labelId: origineFrance.id },
    }),
  ]);

  console.log('✅ Linked brands to categories and labels');

  // ===========================================
  // SAMPLE PRODUCTS
  // ===========================================
  console.log('Creating sample products...');

  const saintJames = sampleBrands[0];
  
  await Promise.all([
    prisma.product.upsert({
      where: { brandId_slug: { brandId: saintJames.id, slug: 'mariniere-guildo' } },
      update: {},
      create: {
        brandId: saintJames.id,
        name: 'Marinière Guildo',
        slug: 'mariniere-guildo',
        descriptionShort: 'La marinière authentique, icône du style breton.',
        priceMin: 79,
        priceMax: 89,
        categoryId: vetementsCategory.id,
        manufacturingLocation: 'Saint-James, Normandie',
        materials: JSON.stringify(['Coton', 'Laine vierge']),
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        externalBuyUrl: 'https://www.saint-james.com/mariniere-guildo',
        tags: JSON.stringify(['iconique', 'coton', 'rayures', 'mixte']),
        status: 'ACTIVE',
        isFeatured: true,
      },
    }),
    prisma.product.upsert({
      where: { brandId_slug: { brandId: saintJames.id, slug: 'pull-binic' } },
      update: {},
      create: {
        brandId: saintJames.id,
        name: 'Pull Binic',
        slug: 'pull-binic',
        descriptionShort: 'Le pull marin authentique en pure laine vierge.',
        priceMin: 159,
        priceMax: 179,
        categoryId: vetementsCategory.id,
        manufacturingLocation: 'Saint-James, Normandie',
        materials: JSON.stringify(['Laine vierge']),
        madeInFranceLevel: MadeInFranceLevel.FABRICATION_100_FRANCE,
        externalBuyUrl: 'https://www.saint-james.com/pull-binic',
        tags: JSON.stringify(['laine', 'hiver', 'chaud', 'classique']),
        status: 'ACTIVE',
        isFeatured: true,
      },
    }),
  ]);

  console.log('✅ Created sample products');

  // ===========================================
  // AI PROMPTS
  // ===========================================
  console.log('Creating AI prompts...');

  await Promise.all([
    prisma.aiPrompt.upsert({
      where: { name_version: { name: 'query_parsing', version: 1 } },
      update: {},
      create: {
        name: 'query_parsing',
        version: 1,
        systemMessage: `Tu es un assistant spécialisé dans l'analyse de requêtes de recherche pour une plateforme de découverte de produits Made in France.

Ta mission est d'extraire les informations structurées d'une requête utilisateur en français.

Catégories: Mode, Maison, Gastronomie, Cosmétiques, Enfants, High-Tech, Sport & Loisirs, Jardin
Tags courants: éco-responsable, bio, vegan, luxe, artisanal, local
Régions: Bretagne, Normandie, Île-de-France, PACA, Occitanie, Nouvelle-Aquitaine, Auvergne-Rhône-Alpes, etc.

Réponds uniquement en JSON structuré.`,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 500,
        isActive: true,
      },
    }),
    prisma.aiPrompt.upsert({
      where: { name_version: { name: 'brand_description', version: 1 } },
      update: {},
      create: {
        name: 'brand_description',
        version: 1,
        systemMessage: `Tu es un rédacteur spécialisé dans la mise en valeur des marques françaises et du Made in France.

Génère des descriptions captivantes qui mettent en avant:
- L'ancrage territorial français
- Le savoir-faire et l'artisanat
- Les valeurs (qualité, durabilité, tradition, innovation)

Utilise un ton chaleureux mais professionnel. Évite les superlatifs excessifs.`,
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1000,
        isActive: true,
      },
    }),
    prisma.aiPrompt.upsert({
      where: { name_version: { name: 'conversation', version: 1 } },
      update: {},
      create: {
        name: 'conversation',
        version: 1,
        systemMessage: `Tu es l'assistant de découverte de MadeInFrance.fr, une plateforme dédiée aux produits et marques fabriqués en France.

Style: Chaleureux, concis, informatif
Tu suggères des marques/produits, expliques les différences, donnes des conseils personnalisés.
Tu ne mentionnes QUE les marques présentes dans les résultats de recherche fournis.
Format: **Nom de la Marque** (région) - environ XX €

Réponds toujours en français.`,
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1500,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created AI prompts');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
