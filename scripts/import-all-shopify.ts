import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Liste des 181 marques Shopify détectées
const shopifyBrands = [
  { slug: '1-3', domain: 'unplustrois.fr' },
  { slug: 'ahpy', domain: 'ahpy.fr' },
  { slug: 'andre-renault', domain: 'andre-renault.com' },
  { slug: 'alohe', domain: 'alohe.store' },
  { slug: 'amewat', domain: 'amewat.com' },
  { slug: 'airpurlabs', domain: 'airpurlabs.com' },
  { slug: 'antesite', domain: 'antesite.com' },
  { slug: 'arienes-paris', domain: 'arienes-paris.com' },
  { slug: 'anny-blatt', domain: 'annyblatt.com' },
  { slug: 'atelier-caradant', domain: 'ateliercaradant.com' },
  { slug: 'atelier-tuffery', domain: 'ateliertuffery.com' },
  { slug: 'ateliers-foures', domain: 'ateliersfoures.fr' },
  { slug: 'baie-des-caps', domain: 'baiedescaps.com' },
  { slug: 'baixe', domain: 'baixe.fr' },
  { slug: 'belle-gnole', domain: 'belle-gnole.fr' },
  { slug: 'berthe-aux-grands-pieds', domain: 'bertheauxgrandspieds.com' },
  { slug: 'biju', domain: 'bijufrance.com' },
  { slug: 'bini', domain: 'binikit.com' },
  { slug: 'bitecone', domain: 'bitecone.com' },
  { slug: 'blanc-bonnet', domain: 'blanc-bonnet.fr' },
  { slug: 'bleu-blanc-ruche', domain: 'bleu-blanc-ruche.fr' },
  { slug: 'bott-lingerie', domain: 'bott-lingerie.com' },
  { slug: 'bounce', domain: 'bouncesports.co' },
  { slug: 'by-chris-k', domain: 'www2.chris-k.fr' },
  { slug: 'cache-toi', domain: 'cache-toi.com' },
  { slug: 'cani-net', domain: 'cani-net.fr' },
  { slug: 'caps-me', domain: 'capsme.fr' },
  { slug: 'cezembre', domain: 'cezembre-store.fr' },
  { slug: 'candle-bar', domain: 'candlebar.fr' },
  { slug: 'chouchou-de-provence', domain: 'chouchoudeprovence.com' },
  { slug: 'cilea-bijoux', domain: 'cileabijoux.com' },
  { slug: 'comme-avant', domain: 'comme-avant.bio' },
  { slug: 'cosmic-blend', domain: 'cosmicblend.co' },
  { slug: 'cozip', domain: 'cozip.fr' },
  { slug: 'cygnes', domain: 'cygnes.co' },
  { slug: 'dao', domain: 'daodavy.com' },
  { slug: 'datus', domain: 'maisondatus.com' },
  { slug: 'drop', domain: 'dropfontaine.com' },
  { slug: 'duralex', domain: 'duralex.com' },
  { slug: 'distillerie-ceres', domain: 'distillerieceres.com' },
  { slug: 'eau-exquise', domain: 'eau-exquise.fr' },
  { slug: 'econotes', domain: 'econotes.co' },
  { slug: 'eco-smethique', domain: 'ecosmethique.com' },
  { slug: 'ekhi', domain: 'ekhi.fr' },
  { slug: 'eminence', domain: 'eminence.fr' },
  { slug: 'ears360', domain: 'ears-360.com' },
  { slug: 'equilibre-instinct', domain: 'equilibre-et-instinct.com' },
  { slug: 'flocon-rebel', domain: 'floconrebel.fr' },
  { slug: 'flor-alp', domain: 'floralp-cosmetiques.fr' },
  { slug: 'furifuri', domain: 'furifuri.com' },
  { slug: 'galatea-kombucha', domain: 'galatea-kombucha.fr' },
  { slug: 'homycat', domain: 'homycat.com' },
  { slug: 'hopoli', domain: 'hopoli.com' },
  { slug: 'horee-cosmetiques', domain: 'horeecosmetiques.com' },
  { slug: 'infuse-me', domain: 'infuseme.fr' },
  { slug: 'inspyrations', domain: 'inspyrations.co' },
  { slug: 'jane-co', domain: 'janeandco.fr' },
  { slug: 'jardins', domain: 'jardins.co' },
  { slug: 'joseph-malinge', domain: 'josephmalinge.com' },
  { slug: 'jup-on', domain: 'jup-on.com' },
  { slug: 'kelonia-paris', domain: 'kelonia-paris.fr' },
  { slug: 'kignon', domain: 'kignon.fr' },
  { slug: 'kadalys', domain: 'kadalys.com' },
  { slug: 'la-bagagerie-victorine', domain: 'labagagerievictorine.com' },
  { slug: 'la-bobine-a-pois', domain: 'labobineapois.com' },
  { slug: 'la-bouclee', domain: 'labouclee.com' },
  { slug: 'la-celebrette', domain: 'lacelebrette.fr' },
  { slug: 'la-french-beauty', domain: 'lafrenchbeautycoloc.com' },
  { slug: 'la-marque-en-moins', domain: 'lamarqueenmoins.fr' },
  { slug: 'la-vie-est-belt', domain: 'lavieestbelt.fr' },
  { slug: 'labonal-et-la-frenchie', domain: 'lafrenchie.fr' },
  { slug: 'laferte-whisky', domain: 'lafertewhisky.com' },
  { slug: 'lafrancaise-mailles', domain: 'lafrancaise-mailles.fr' },
  { slug: 'l-arrange-francais', domain: 'larrangefrancais.com' },
  { slug: 'l-artisan-tisserin', domain: 'lartisantisserin.com' },
  { slug: 'l-atelier-c', domain: 'latelierc.co' },
  { slug: 'l-ar', domain: 'lar-boutique.com' },
  { slug: 'le-bourget', domain: 'lebourget.com' },
  { slug: 'le-cuisinier-francais', domain: 'lecuisinierfrancais.com' },
  { slug: 'le-gaulois-jeans', domain: 'legauloisjeans.com' },
  { slug: 'le-petit-biscuit-francais', domain: 'lepetitbiscuitfrancais.fr' },
  { slug: 'le-rivage-paris', domain: 'lerivageparis.com' },
  { slug: 'lemon-squeezer-factory', domain: 'lemonsqueezerfactory.com' },
  { slug: 'les-benefiques', domain: 'lesbenefiques.com' },
  { slug: 'les-bougies-d-alexandra', domain: 'les-bougiesdalexandra.fr' },
  { slug: 'leggun', domain: 'leggun.fr' },
  { slug: 'les-polettes', domain: 'lespolettes.com' },
  { slug: 'les-poulettes-paris', domain: 'lespoulettesparis.com' },
  { slug: 'les-toiles-du-large', domain: 'lestoilesdularge.com' },
  { slug: 'libelte', domain: 'libelte.com' },
  { slug: 'lilikiwi', domain: 'lilikiwi.fr' },
  { slug: 'linae', domain: 'linaecosmetics.com' },
  { slug: 'lizia', domain: 'lizia.fr' },
  { slug: 'lo-neel', domain: 'loneel.com' },
  { slug: 'l-officine-du-monde', domain: 'lofficinedumonde.fr' },
  { slug: 'loulenn', domain: 'loulenn.fr' },
  { slug: 'lunasol', domain: 'lunasolbijoux.fr' },
  { slug: 'lundi-en-huit', domain: 'lundienhuit.fr' },
  { slug: 'lxir', domain: 'lxir-drink.com' },
  { slug: 'mailcott', domain: 'mailcottparis.fr' },
  { slug: 'maison-brava', domain: 'maisonbrava.com' },
  { slug: 'maison-gang', domain: 'maisongang.fr' },
  { slug: 'maison-izard', domain: 'maisonizard.com' },
  { slug: 'maison-lucie', domain: 'maison-lucie.fr' },
  { slug: 'maison-marthe', domain: 'conserverie-maison-marthe.fr' },
  { slug: 'maison-soleil', domain: 'maison-soleil.fr' },
  { slug: 'maison-tassan', domain: 'maisontassan.com' },
  { slug: 'manufacture-perrin-1924', domain: 'manufacture-perrin.com' },
  { slug: 'mat-lolo', domain: 'matlolo.com' },
  { slug: 'mamik', domain: 'mamik.fr' },
  { slug: 'merveilles-du-monde', domain: 'merveilles-du-monde.fr' },
  { slug: 'meduse', domain: 'meduse.com' },
  { slug: 'neogourmets', domain: 'neogourmets.com' },
  { slug: 'mona-watches', domain: 'monawatches.com' },
  { slug: 'nola-confiserie', domain: 'nolaconfiserie.fr' },
  { slug: 'ocean-clock', domain: 'oceanclock.com' },
  { slug: 'omoye', domain: 'omoye.com' },
  { slug: 'opari', domain: 'opari-creations.com' },
  { slug: 'oppidum', domain: 'oppidum-france.com' },
  { slug: 'pake', domain: 'pake.fr' },
  { slug: 'pamplemousse-peluches', domain: 'pamplemoussepeluches.com' },
  { slug: 'papilles-cocktails', domain: 'papillescocktails.fr' },
  { slug: 'patacreer', domain: 'patacreer.fr' },
  { slug: 'pavenrod', domain: 'pavenrod.fr' },
  { slug: 'parfums-des-iles', domain: 'parfums-des-iles.com' },
  { slug: 'pente-douce', domain: 'pentedouce.fr' },
  { slug: 'piece-rapportee', domain: 'puzzlepiecerapportee.fr' },
  { slug: 'pierrot-gourmand', domain: 'pierrot-gourmand.com' },
  { slug: 'pikoc', domain: 'pikoc.fr' },
  { slug: 'pipolaki', domain: 'pipolaki.com' },
  { slug: 'pirate-cannerie', domain: 'pirate-cannerie.fr' },
  { slug: 'polux', domain: 'lampe-polux.fr' },
  { slug: 'pom-pom', domain: 'pompom-calvados.fr' },
  { slug: 'pres-des-reines', domain: 'presdesreines.fr' },
  { slug: 'ptitcul', domain: 'ptitcul.fr' },
  { slug: 'pivoine-signature', domain: 'pivoine-signature.com' },
  { slug: 'rose-lane-paris', domain: 'roselane.fr' },
  { slug: 'royal-mer', domain: 'royal-mer.com' },
  { slug: 'saint-james', domain: 'fr.saint-james.com' },
  { slug: 'savonnerie-elise', domain: 'savonnerie-elise.com' },
  { slug: 'skin-diligent', domain: 'skindiligent.com' },
  { slug: 'spiruline-des-iles-d-or', domain: 'spiruline-des-iles-dor.com' },
  { slug: 'studio-quito', domain: 'studioquito.com' },
  { slug: 'tarrerias-bonjean', domain: 'tb-groupe.fr' },
  { slug: 'tsipie', domain: 'tsipie.com' },
  { slug: 'vasimimile', domain: 'vasimimile.com' },
  { slug: 'vercuma', domain: 'vercuma.com' },
  { slug: 'vous-pouvez-dormir-dans-la-grange', domain: 'vouspouvezdormirdanslagrange.fr' },
  { slug: 'well', domain: 'well.fr' },
  { slug: 'yoleau', domain: 'yoleau.com' },
  { slug: 'wia', domain: 'wiacosmetiques.com' },
  { slug: 'raptor-nutrition', domain: 'raptornutrition.fr' },
  { slug: 'le-minor', domain: 'leminor.fr' },
  { slug: 'le-slip-francais', domain: 'leslipfrancais.fr' },
  { slug: 'victoray', domain: 'victoray.co' },
  { slug: 'navir', domain: 'navir.fr' },
  { slug: 'zested-cosmetic', domain: 'zestedcosmetic.com' },
  { slug: 'zeste', domain: 'zeste.fr' },
  { slug: 'bohin-france', domain: 'bohin.com' },
  { slug: 'pyrenex', domain: 'pyrenex.com' },
  { slug: '909', domain: '909-upcycling.com' },
  { slug: 'ancree', domain: 'ancree.com' },
  { slug: 'courtois-paris', domain: 'courtoisparis.fr' },
  { slug: 'jeanne-a-dit', domain: 'jeanneadit.com' },
  { slug: 'le-parfumoir-de-grasse', domain: 'leparfumoir.com' },
  { slug: 'les-sauvages', domain: 'lessauvages.co' },
  { slug: 'maison-granola', domain: 'maisongranola.fr' },
  { slug: 'pomponne', domain: 'pomponne-makeup.com' },
  { slug: 'aluvy', domain: 'aluvy-design.com' },
  { slug: 'atelier-baltus', domain: 'atelier-baltus.fr' },
  { slug: 'aux-bains-francais', domain: 'auxbainsfrancais.com' },
  { slug: 'blinkbook', domain: 'editions-animees.com' },
  { slug: 'ziggy', domain: 'ziggyfamily.com' },
  { slug: 'ciment', domain: 'ciment.paris' },
  { slug: 'flanm-saveurs', domain: 'flanmetsaveurs.fr' },
  { slug: 'lopale-productions', domain: 'lopaleproductions.fr' },
  { slug: 'maison-broussaud', domain: 'maisonbroussaud.fr' },
  { slug: 'savonnerie-baba', domain: 'savonnier-patissier.com' },
  { slug: 'sirops-lissip', domain: 'lissip.fr' },
  { slug: 'thelma-rose', domain: 'thelma-rose.com' },
  { slug: 'virginie-voncken', domain: 'virginievoncken.paris' },
];

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  updated_at: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    available: boolean;
  }>;
  images: Array<{ src: string }>;
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/__TAB__/g, '')
    .trim();
}

async function fetchShopifyProducts(domain: string): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250;

  while (true) {
    const url = `https://${domain}/products.json?limit=${limit}&page=${page}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) break;
      
      const data = await response.json();
      if (!data.products || data.products.length === 0) break;
      
      allProducts.push(...data.products);
      if (data.products.length < limit) break;
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch {
      break;
    }
  }
  
  return allProducts;
}

async function importBrandProducts(brandSlug: string, domain: string): Promise<{ created: number; updated: number; errors: number }> {
  const result = { created: 0, updated: 0, errors: 0 };
  
  // Trouver la marque
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
  if (!brand) {
    console.log(`   ⚠️ Marque non trouvée: ${brandSlug}`);
    return result;
  }
  
  // Fetch produits
  const products = await fetchShopifyProducts(domain);
  if (products.length === 0) {
    console.log(`   ⚠️ Aucun produit trouvé`);
    return result;
  }
  
  for (const shopifyProduct of products) {
    try {
      const productSlug = `${brandSlug}-${shopifyProduct.handle}`;
      const availableVariant = shopifyProduct.variants.find(v => v.available) || shopifyProduct.variants[0];
      const price = availableVariant ? parseFloat(availableVariant.price) : null;
      const imageUrl = shopifyProduct.images[0]?.src || null;
      
      const productData = {
        name: shopifyProduct.title,
        slug: productSlug,
        descriptionShort: cleanHtml(shopifyProduct.body_html).substring(0, 500),
        descriptionLong: cleanHtml(shopifyProduct.body_html),
        priceMin: price,
        priceMax: price,
        imageUrl: imageUrl,
        brandId: brand.id,
        externalId: shopifyProduct.id.toString(),
        externalSource: 'shopify',
        externalData: JSON.stringify({
          handle: shopifyProduct.handle,
          vendor: shopifyProduct.vendor,
          product_type: shopifyProduct.product_type,
          tags: shopifyProduct.tags,
          variants: shopifyProduct.variants.map(v => ({
            id: v.id,
            title: v.title,
            price: v.price,
            sku: v.sku,
            available: v.available
          })),
          images: shopifyProduct.images.map(i => i.src),
          updated_at: shopifyProduct.updated_at
        })
      };
      
      const existingProduct = await prisma.product.findFirst({
        where: { brandId: brand.id, externalId: shopifyProduct.id.toString() }
      });
      
      if (existingProduct) {
        await prisma.product.update({ where: { id: existingProduct.id }, data: productData });
        result.updated++;
      } else {
        await prisma.product.create({ data: productData });
        result.created++;
      }
    } catch {
      result.errors++;
    }
  }
  
  return result;
}

async function main() {
  console.log('🚀 Import massif des produits Shopify - Made in France\n');
  console.log(`📦 ${shopifyBrands.length} marques à traiter\n`);
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let brandsProcessed = 0;
  let brandsSkipped = 0;
  
  for (const { slug, domain } of shopifyBrands) {
    process.stdout.write(`[${brandsProcessed + 1}/${shopifyBrands.length}] ${slug}... `);
    
    try {
      const result = await importBrandProducts(slug, domain);
      
      if (result.created + result.updated > 0) {
        console.log(`✅ ${result.created} créés, ${result.updated} mis à jour`);
        totalCreated += result.created;
        totalUpdated += result.updated;
        totalErrors += result.errors;
        brandsProcessed++;
      } else {
        console.log(`⏭️ Aucun produit`);
        brandsSkipped++;
      }
    } catch (error) {
      console.log(`❌ Erreur`);
      brandsSkipped++;
    }
    
    // Rate limiting entre les marques
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ FINAL');
  console.log('='.repeat(50));
  console.log(`✅ Marques traitées: ${brandsProcessed}`);
  console.log(`⏭️ Marques ignorées: ${brandsSkipped}`);
  console.log(`📦 Produits créés: ${totalCreated}`);
  console.log(`🔄 Produits mis à jour: ${totalUpdated}`);
  console.log(`❌ Erreurs: ${totalErrors}`);
  console.log(`\n🎉 Total produits en base: ${totalCreated + totalUpdated}`);
  
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Erreur fatale:', error);
  await prisma.$disconnect();
  process.exit(1);
});
