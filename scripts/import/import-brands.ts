#!/usr/bin/env tsx
/**
 * Made in France - Excel/CSV Import Script
 * 
 * Usage:
 *   pnpm tsx scripts/import/import-brands.ts <file.xlsx|file.csv> [--dry-run]
 * 
 * This script imports brands from an Excel or CSV file into the database.
 * It handles:
 *   - Column name normalization
 *   - Region/Sector/Category matching
 *   - Data validation and cleaning
 *   - Duplicate detection
 *   - Error reporting
 */

import { PrismaClient, MadeInFranceLevel, BrandStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// ===========================================
// CONFIGURATION
// ===========================================

const COLUMN_MAPPING: Record<string, string> = {
  // Name variations
  'nom': 'name',
  'nom marque': 'name',
  'nom entreprise': 'name',
  'entreprise': 'name',
  'marque': 'name',
  'société': 'name',
  'raison sociale': 'name',
  
  // Website
  'site': 'websiteUrl',
  'site web': 'websiteUrl',
  'url': 'websiteUrl',
  'site internet': 'websiteUrl',
  'website': 'websiteUrl',
  
  // Logo
  'image (logo)': 'logoUrl',
  'logo': 'logoUrl',
  'logo_url': 'logoUrl',
  
  // Sector
  'secteur': 'sectorName',
  'activité': 'sectorName',
  'domaine': 'sectorName',
  'secteur d\'activité': 'sectorName',
  
  // Category / Tags
  'catégorie': 'categoryName',
  'type': 'categoryName',
  'produits': 'categoryName',
  'tags': 'tags',
  
  // Location
  'région': 'regionName',
  'region': 'regionName',
  'ville': 'city',
  'ville (siege/atelier)': 'city',
  'ville (siège/atelier)': 'city',
  'localisation': 'city',
  'département': 'department',
  'departement': 'department',
  'numero département': 'departmentCode',
  'numero departement': 'departmentCode',
  'numéro département': 'departmentCode',
  'code postal': 'postalCode',
  'cp': 'postalCode',
  'adresse': 'address',
  
  // Description
  'description': 'descriptionShort',
  'présentation': 'descriptionShort',
  'à propos': 'descriptionShort',
  
  // Social
  'instagram': 'instagram',
  'insta': 'instagram',
  'facebook': 'facebook',
  'fb': 'facebook',
  'linkedin': 'linkedin',
  'tiktok': 'tiktok',
  
  // Labels - EPV, OFG, Artisan
  'labels': 'labels',
  'certifications': 'labels',
  'certification': 'labels',
  'epv': 'labelEPV',
  'epv*': 'labelEPV',
  'ofg': 'labelOFG',
  'ofg**': 'labelOFG',
  'artisan': 'labelArtisan',
  'artisan (cma)': 'labelArtisan',
  
  // Made in France
  '100% france': 'madeInFranceLevel',
  'made in france': 'madeInFranceLevel',
  'fabrication': 'madeInFranceLevel',
  'origine': 'madeInFranceLevel',
  
  // Contact
  'email': 'email',
  'mail': 'email',
  'téléphone': 'phone',
  'tel': 'phone',
};

const REGION_ALIASES: Record<string, string> = {
  'bretagne': 'Bretagne',
  'bzh': 'Bretagne',
  'normandie': 'Normandie',
  'ile de france': 'Île-de-France',
  'ile-de-france': 'Île-de-France',
  'idf': 'Île-de-France',
  'paris': 'Île-de-France',
  'paca': "Provence-Alpes-Côte d'Azur",
  'provence': "Provence-Alpes-Côte d'Azur",
  'auvergne rhône alpes': 'Auvergne-Rhône-Alpes',
  'auvergne-rhône-alpes': 'Auvergne-Rhône-Alpes',
  'rhône alpes': 'Auvergne-Rhône-Alpes',
  'auvergne': 'Auvergne-Rhône-Alpes',
  'nouvelle aquitaine': 'Nouvelle-Aquitaine',
  'nouvelle-aquitaine': 'Nouvelle-Aquitaine',
  'aquitaine': 'Nouvelle-Aquitaine',
  'occitanie': 'Occitanie',
  'languedoc': 'Occitanie',
  'midi pyrénées': 'Occitanie',
  'hauts de france': 'Hauts-de-France',
  'hauts-de-france': 'Hauts-de-France',
  'nord': 'Hauts-de-France',
  'picardie': 'Hauts-de-France',
  'grand est': 'Grand Est',
  'alsace': 'Grand Est',
  'lorraine': 'Grand Est',
  'champagne': 'Grand Est',
  'pays de la loire': 'Pays de la Loire',
  'pays-de-la-loire': 'Pays de la Loire',
  'centre val de loire': 'Centre-Val de Loire',
  'centre-val de loire': 'Centre-Val de Loire',
  'centre': 'Centre-Val de Loire',
  'bourgogne franche comté': 'Bourgogne-Franche-Comté',
  'bourgogne-franche-comté': 'Bourgogne-Franche-Comté',
  'bourgogne': 'Bourgogne-Franche-Comté',
  'corse': 'Corse',
};

const SECTOR_MAPPING: Record<string, string> = {
  // Mode & Accessoires
  'mode & accessoires': 'Mode & Accessoires',
  'mode': 'Mode & Accessoires',
  'accessoires': 'Mode & Accessoires',
  'textile': 'Mode & Accessoires',
  'vêtements': 'Mode & Accessoires',
  'habillement': 'Mode & Accessoires',
  'chaussures': 'Mode & Accessoires',
  'maroquinerie': 'Mode & Accessoires',
  
  // Maison & Jardin
  'maison & jardin': 'Maison & Jardin',
  'maison': 'Maison & Jardin',
  'jardin': 'Maison & Jardin',
  'décoration': 'Maison & Jardin',
  'déco': 'Maison & Jardin',
  'mobilier': 'Maison & Jardin',
  'ameublement': 'Maison & Jardin',
  'linge': 'Maison & Jardin',
  'extérieur': 'Maison & Jardin',
  
  // Gastronomie
  'gastronomie': 'Gastronomie',
  'alimentaire': 'Gastronomie',
  'food': 'Gastronomie',
  'agroalimentaire': 'Gastronomie',
  'épicerie': 'Gastronomie',
  'boissons': 'Gastronomie',
  
  // Cosmétique
  'cosmétique': 'Cosmétique',
  'cosmetique': 'Cosmétique',
  'cosmétiques': 'Cosmétique',
  'beauté': 'Cosmétique',
  'soins': 'Cosmétique',
  
  // Enfance
  'enfance': 'Enfance',
  'enfant': 'Enfance',
  'enfants': 'Enfance',
  'puériculture': 'Enfance',
  'jouets': 'Enfance',
  
  // Loisirs & Sport
  'loisirs & sport': 'Loisirs & Sport',
  'loisirs': 'Loisirs & Sport',
  'sport': 'Loisirs & Sport',
  'outdoor': 'Loisirs & Sport',
  'sport & loisirs': 'Loisirs & Sport',
  
  // Animaux
  'animaux': 'Animaux',
  'animal': 'Animaux',
  'animalerie': 'Animaux',
  
  // Santé & Nutrition
  'santé & nutrition': 'Santé & Nutrition',
  'santé': 'Santé & Nutrition',
  'nutrition': 'Santé & Nutrition',
  'bien-être': 'Santé & Nutrition',
  
  // High-Tech
  'high-tech': 'High-Tech',
  'hightech': 'High-Tech',
  'tech': 'High-Tech',
  'électronique': 'High-Tech',
  'informatique': 'High-Tech',
};

const MADE_IN_FRANCE_MAPPING: Record<string, MadeInFranceLevel> = {
  '100%': MadeInFranceLevel.FABRICATION_100_FRANCE,
  '100% france': MadeInFranceLevel.FABRICATION_100_FRANCE,
  '100% français': MadeInFranceLevel.FABRICATION_100_FRANCE,
  'fabriqué en france': MadeInFranceLevel.FABRICATION_100_FRANCE,
  'fabrication française': MadeInFranceLevel.FABRICATION_100_FRANCE,
  
  'assemblé': MadeInFranceLevel.ASSEMBLE_FRANCE,
  'assemblé en france': MadeInFranceLevel.ASSEMBLE_FRANCE,
  
  'conçu': MadeInFranceLevel.CONCU_FRANCE,
  'conçu en france': MadeInFranceLevel.CONCU_FRANCE,
  'designed in france': MadeInFranceLevel.CONCU_FRANCE,
  
  'matières françaises': MadeInFranceLevel.MATIERE_FRANCE,
  'matières premières': MadeInFranceLevel.MATIERE_FRANCE,
  
  'entreprise française': MadeInFranceLevel.ENTREPRISE_FRANCAISE,
  'société française': MadeInFranceLevel.ENTREPRISE_FRANCAISE,
};

// ===========================================
// HELPERS
// ===========================================

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function cleanUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  
  url = url.trim();
  if (!url) return null;
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Basic validation
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ===========================================
// IMPORTER CLASS
// ===========================================

interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data?: unknown }>;
}

class BrandImporter {
  private regionsCache: Map<string, { id: string; name: string }> = new Map();
  private sectorsCache: Map<string, { id: string; name: string }> = new Map();
  private categoriesCache: Map<string, { id: string; name: string }> = new Map();
  private labelsCache: Map<string, { id: string; name: string }> = new Map();
  private stats: ImportStats = {
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };
  private dryRun: boolean;

  constructor(dryRun = false) {
    this.dryRun = dryRun;
  }

  async loadReferenceData(): Promise<void> {
    console.log('📚 Loading reference data...');

    // Load regions
    const regions = await prisma.region.findMany();
    regions.forEach((r) => {
      this.regionsCache.set(r.name.toLowerCase(), { id: r.id, name: r.name });
      this.regionsCache.set(r.slug, { id: r.id, name: r.name });
    });

    // Load sectors
    const sectors = await prisma.sector.findMany();
    sectors.forEach((s) => {
      this.sectorsCache.set(s.name.toLowerCase(), { id: s.id, name: s.name });
      this.sectorsCache.set(s.slug, { id: s.id, name: s.name });
    });

    // Load categories
    const categories = await prisma.category.findMany();
    categories.forEach((c) => {
      this.categoriesCache.set(c.name.toLowerCase(), { id: c.id, name: c.name });
      this.categoriesCache.set(c.slug, { id: c.id, name: c.name });
    });

    // Load labels
    const labels = await prisma.label.findMany();
    labels.forEach((l) => {
      this.labelsCache.set(l.name.toLowerCase(), { id: l.id, name: l.name });
      this.labelsCache.set(l.slug, { id: l.id, name: l.name });
    });

    console.log(`   ✓ ${regions.length} regions`);
    console.log(`   ✓ ${sectors.length} sectors`);
    console.log(`   ✓ ${categories.length} categories`);
    console.log(`   ✓ ${labels.length} labels`);
  }

  normalizeColumns(data: Record<string, unknown>[]): Record<string, unknown>[] {
    return data.map((row) => {
      const normalized: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = normalizeColumnName(key);
        const mappedKey = COLUMN_MAPPING[normalizedKey] || normalizedKey;
        normalized[mappedKey] = value;
      }
      
      return normalized;
    });
  }

  findRegion(regionName: string | undefined | null): { id: string; name: string } | null {
    if (!regionName || typeof regionName !== 'string') return null;
    
    const normalized = regionName.toLowerCase().trim();
    
    // Try direct match
    if (this.regionsCache.has(normalized)) {
      return this.regionsCache.get(normalized)!;
    }
    
    // Try alias
    const aliasedName = REGION_ALIASES[normalized];
    if (aliasedName) {
      return this.regionsCache.get(aliasedName.toLowerCase()) || null;
    }
    
    return null;
  }

  findSector(sectorName: string | undefined | null): { id: string; name: string } | null {
    if (!sectorName || typeof sectorName !== 'string') return null;
    
    const normalized = sectorName.toLowerCase().trim();
    
    // Try direct match
    if (this.sectorsCache.has(normalized)) {
      return this.sectorsCache.get(normalized)!;
    }
    
    // Try mapping
    const mappedName = SECTOR_MAPPING[normalized];
    if (mappedName) {
      return this.sectorsCache.get(mappedName.toLowerCase()) || null;
    }
    
    return null;
  }

  parseMadeInFranceLevel(value: string | undefined | null): MadeInFranceLevel {
    if (!value || typeof value !== 'string') return MadeInFranceLevel.MIXTE;
    
    const normalized = value.toLowerCase().trim();
    
    for (const [key, level] of Object.entries(MADE_IN_FRANCE_MAPPING)) {
      if (normalized.includes(key)) {
        return level;
      }
    }
    
    // Check for boolean-like values
    if (['oui', 'yes', '1', 'true', 'x'].includes(normalized)) {
      return MadeInFranceLevel.FABRICATION_100_FRANCE;
    }
    
    return MadeInFranceLevel.MIXTE;
  }

  parseSocialLinks(row: Record<string, unknown>): Record<string, string> {
    const social: Record<string, string> = {};
    
    const fields = ['instagram', 'facebook', 'linkedin', 'tiktok'];
    for (const field of fields) {
      const value = row[field];
      if (value && typeof value === 'string') {
        const url = cleanUrl(value);
        if (url) {
          social[field] = url;
        }
      }
    }
    
    return social;
  }

  parseLabels(labelsStr: string | undefined | null): string[] {
    if (!labelsStr || typeof labelsStr !== 'string') return [];
    
    const labelIds: string[] = [];
    
    // Split by common separators
    const labelNames = labelsStr
      .replace(/;/g, ',')
      .replace(/\|/g, ',')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    
    for (const name of labelNames) {
      const label = this.labelsCache.get(name);
      if (label) {
        labelIds.push(label.id);
      }
    }
    
    return labelIds;
  }

  async processRow(row: Record<string, unknown>, index: number): Promise<void> {
    try {
      // Required: name
      const name = row.name as string;
      if (!name || typeof name !== 'string' || !name.trim()) {
        this.stats.errors.push({
          row: index,
          error: 'Nom manquant ou invalide',
          data: row,
        });
        return;
      }

      const cleanName = name.trim();
      const slug = slugify(cleanName);

      // Check for existing brand
      const existing = await prisma.brand.findUnique({
        where: { slug },
      });

      // Build brand data
      const region = this.findRegion(row.regionName as string);
      const sector = this.findSector(row.sectorName as string);
      const socialLinks = this.parseSocialLinks(row);
      
      // Parse labels from EPV, OFG, Artisan columns
      const labelIds: string[] = [];
      
      // Check EPV label
      const epvValue = row.labelEPV as string;
      if (epvValue && ['oui', 'yes', '1', 'true', 'x', '✓', '✔'].includes(String(epvValue).toLowerCase().trim())) {
        const epvLabel = this.labelsCache.get('entreprise du patrimoine vivant');
        if (epvLabel) labelIds.push(epvLabel.id);
      }
      
      // Check OFG label
      const ofgValue = row.labelOFG as string;
      if (ofgValue && ['oui', 'yes', '1', 'true', 'x', '✓', '✔'].includes(String(ofgValue).toLowerCase().trim())) {
        const ofgLabel = this.labelsCache.get('origine france garantie');
        if (ofgLabel) labelIds.push(ofgLabel.id);
      }
      
      // Check Artisan label
      const artisanValue = row.labelArtisan as string;
      if (artisanValue && ['oui', 'yes', '1', 'true', 'x', '✓', '✔'].includes(String(artisanValue).toLowerCase().trim())) {
        const artisanLabel = this.labelsCache.get('artisan');
        if (artisanLabel) labelIds.push(artisanLabel.id);
      }
      
      // Also parse labels from labels column if present
      const additionalLabels = this.parseLabels(row.labels as string);
      labelIds.push(...additionalLabels);

      const brandData = {
        name: cleanName,
        slug,
        descriptionShort: row.descriptionShort as string || null,
        websiteUrl: cleanUrl(row.websiteUrl as string),
        logoUrl: cleanUrl(row.logoUrl as string),
        city: (row.city as string)?.trim() || null,
        postalCode: (row.postalCode as string)?.toString().trim() || null,
        address: (row.address as string)?.trim() || null,
        regionId: region?.id || null,
        sectorId: sector?.id || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : {},
        madeInFranceLevel: this.parseMadeInFranceLevel(row.madeInFranceLevel as string),
        status: BrandStatus.PENDING_REVIEW,
      };

      if (this.dryRun) {
        console.log(`   [DRY RUN] Would ${existing ? 'update' : 'create'}: ${cleanName}`);
        if (existing) {
          this.stats.updated++;
        } else {
          this.stats.imported++;
        }
        return;
      }

      if (existing) {
        // Update existing brand
        await prisma.brand.update({
          where: { id: existing.id },
          data: brandData,
        });
        this.stats.updated++;
      } else {
        // Create new brand
        const brand = await prisma.brand.create({
          data: brandData,
        });

        // Link labels (remove duplicates)
        const uniqueLabelIds = [...new Set(labelIds)];
        if (uniqueLabelIds.length > 0) {
          await prisma.brandLabel.createMany({
            data: uniqueLabelIds.map((labelId) => ({
              brandId: brand.id,
              labelId,
            })),
            skipDuplicates: true,
          });
        }

        this.stats.imported++;
      }
    } catch (error) {
      this.stats.errors.push({
        row: index,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: row,
      });
    }
  }

  async importFile(filePath: string): Promise<ImportStats> {
    console.log(`\n📂 Reading file: ${filePath}\n`);

    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file
    const ext = path.extname(filePath).toLowerCase();
    let data: Record<string, unknown>[];

    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === '.csv') {
      const workbook = XLSX.readFile(filePath, { type: 'file' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(sheet);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    this.stats.total = data.length;
    console.log(`📊 Found ${data.length} rows\n`);

    // Load reference data
    await this.loadReferenceData();

    // Normalize column names
    const normalizedData = this.normalizeColumns(data);

    // Process rows
    console.log('\n🔄 Processing rows...\n');
    let processed = 0;

    for (let i = 0; i < normalizedData.length; i++) {
      await this.processRow(normalizedData[i], i + 2); // +2 for 1-indexed + header row
      processed++;

      // Progress indicator
      if (processed % 50 === 0) {
        console.log(`   Processed ${processed}/${this.stats.total} rows...`);
      }
    }

    return this.stats;
  }
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Made in France - Brand Import Script

Usage:
  pnpm tsx scripts/import/import-brands.ts <file.xlsx|file.csv> [options]

Options:
  --dry-run    Preview changes without modifying the database
  --help, -h   Show this help message

Examples:
  pnpm tsx scripts/import/import-brands.ts data/brands.xlsx
  pnpm tsx scripts/import/import-brands.ts data/brands.csv --dry-run
    `);
    process.exit(0);
  }

  const filePath = args[0];
  const dryRun = args.includes('--dry-run');

  console.log('\n🇫🇷 Made in France - Brand Import\n');
  console.log('═'.repeat(50));

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
  }

  try {
    const importer = new BrandImporter(dryRun);
    const stats = await importer.importFile(filePath);

    console.log('\n' + '═'.repeat(50));
    console.log('\n📈 Import Summary:\n');
    console.log(`   Total rows:   ${stats.total}`);
    console.log(`   Imported:     ${stats.imported}`);
    console.log(`   Updated:      ${stats.updated}`);
    console.log(`   Skipped:      ${stats.skipped}`);
    console.log(`   Errors:       ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`   Row ${error.row}: ${error.error}`);
      }
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n✅ Import complete!\n');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
