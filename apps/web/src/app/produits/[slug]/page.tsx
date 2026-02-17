'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  ExternalLink, 
  ShoppingBag,
  Factory,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Shield,
  Heart,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  descriptionLong: string | null;
  imageUrl: string | null;
  galleryUrls: string[];
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  manufacturingLocation: string | null;
  materials: string[];
  madeInFranceLevel: string | null;
  externalBuyUrl: string | null;
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    city: string | null;
    region: { name: string } | null;
    sector: { 
      name: string;
      slug: string;
      color: string | null;
    } | null;
  };
}

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brand: {
    name: string;
    slug: string;
  };
}

// Fonction pour obtenir le favicon Google
function getGoogleFavicon(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch {
    return null;
  }
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`http://localhost:4000/api/v1/products/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Produit non trouvé');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }
        const data = await response.json();
        setProduct(data.data);

        // Charger les produits similaires (même marque)
        if (data.data.brand?.slug) {
          const similarRes = await fetch(`http://localhost:4000/api/v1/brands/${data.data.brand.slug}/products?limit=5`);
          const similarData = await similarRes.json();
          setSimilarProducts(
            (similarData.data || [])
              .filter((p: SimilarProduct) => p.slug !== slug)
              .slice(0, 4)
          );
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/marques" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Produit non trouvé'}
            </h1>
            <p className="text-gray-500">
              Ce produit n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sectorColor = product.brand?.sector?.color || '#002395';
  
  // Construire la galerie d'images
  const allImages = [
  ...(product.imageUrl ? [product.imageUrl] : []),
  ...(product.galleryUrls || []).filter(url => url !== product.imageUrl)
].filter(Boolean);

  // Logo : utiliser Google Favicons comme source principale
  const brandLogoUrl = getGoogleFavicon(product.brand.websiteUrl);

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min) return null;
    if (min === max || !max) {
      return `${min.toFixed(2).replace('.', ',')} €`;
    }
    return `${min.toFixed(2).replace('.', ',')} € - ${max.toFixed(2).replace('.', ',')} €`;
  };

  const getMadeInFranceLabel = (level: string) => {
    const labels: Record<string, string> = {
      'FABRICATION_100_FRANCE': '100% Fabriqué en France',
      'ASSEMBLE_FRANCE': 'Assemblé en France',
      'CONCU_FRANCE': 'Conçu en France',
      'MATIERE_FRANCE': 'Matières françaises',
      'ENTREPRISE_FRANCAISE': 'Entreprise française',
      'MIXTE': 'Production mixte',
    };
    return labels[level] || level;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // URL d'achat : soit l'URL produit, soit le site de la marque
  const buyUrl = product.externalBuyUrl || product.brand.websiteUrl;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Accueil</Link>
            <span>/</span>
            <Link href="/marques" className="hover:text-gray-900">Marques</Link>
            <span>/</span>
            <Link href={`/marques/${product.brand.slug}`} className="hover:text-gray-900">
              {product.brand.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Galerie d'images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
              {allImages.length > 0 ? (
                <>
                  <img
                    src={allImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                  />
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white text-8xl font-bold"
                  style={{ backgroundColor: sectorColor }}
                >
                  {product.name.charAt(0)}
                </div>
              )}
              
              {/* Badge Made in France */}
              <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
                <span className="text-lg">🇫🇷</span>
                <span className="text-sm font-medium text-gray-900">Made in France</span>
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex 
                        ? 'border-gray-900 shadow-md' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="lg:py-4">
            {/* Marque avec logo */}
            <Link 
              href={`/marques/${product.brand.slug}`}
              className="inline-flex items-center gap-3 mb-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                {brandLogoUrl && !logoError ? (
                  <img 
                    src={brandLogoUrl} 
                    alt={product.brand.name}
                    className="w-8 h-8 object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span 
                    className="text-lg font-bold text-white w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: sectorColor }}
                  >
                    {product.brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-900 group-hover:text-france-blue transition-colors font-semibold block">
                  {product.brand.name}
                </span>
                {product.brand.city && (
                  <span className="text-sm text-gray-500">{product.brand.city}</span>
                )}
              </div>
            </Link>

            {/* Nom */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Prix */}
            {formatPrice(product.priceMin, product.priceMax) && (
              <p className="text-3xl font-bold text-gray-900 mb-6">
                {formatPrice(product.priceMin, product.priceMax)}
              </p>
            )}

            {/* Description courte */}
            {product.descriptionShort && (
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {product.descriptionShort}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-3 mb-8">
              {buyUrl && (
                <Button
                  size="lg"
                  className="btn-buy-shimmer w-full text-white text-lg h-14 rounded-xl font-semibold"
                  style={{ backgroundColor: sectorColor }}
                  asChild
                >
                  <a href={buyUrl} target="_blank" rel="noopener noreferrer">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Acheter sur {product.brand.name}
                    <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
                  </a>
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  className={`flex-1 h-12 rounded-xl ${isWishlisted ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart className={`h-5 w-5 mr-2 ${isWishlisted ? 'fill-red-500' : ''}`} />
                  {isWishlisted ? 'Sauvegardé' : 'Sauvegarder'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-12 w-12 rounded-xl p-0"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Garanties */}
            <div className="border rounded-xl p-4 space-y-3 mb-8">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Factory className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Fabriqué en France</p>
                  <p className="text-sm text-gray-500">Production locale et artisanale</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Marque vérifiée</p>
                  <p className="text-sm text-gray-500">Authenticité garantie</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Livraison depuis la France</p>
                  <p className="text-sm text-gray-500">Expédition rapide</p>
                </div>
              </div>
            </div>

            {/* Infos marque */}
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {brandLogoUrl && !logoError ? (
                    <img 
                      src={brandLogoUrl} 
                      alt={product.brand.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <span 
                      className="text-xl font-bold text-white w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: sectorColor }}
                    >
                      {product.brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.brand.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {product.brand.city}
                    {product.brand.region && ` • ${product.brand.region.name}`}
                    {product.brand.sector && ` • ${product.brand.sector.name}`}
                  </p>
                  <Link 
                    href={`/marques/${product.brand.slug}`}
                    className="inline-flex items-center text-sm font-medium hover:underline"
                    style={{ color: sectorColor }}
                  >
                    Voir tous les produits de la marque →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description longue */}
        {product.descriptionLong && product.descriptionLong !== product.descriptionShort && (
          <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Description du produit
            </h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              {product.descriptionLong}
            </div>
          </div>
        )}

        {/* Caractéristiques */}
        {(product.materials?.length > 0 || product.manufacturingLocation || product.madeInFranceLevel) && (
          <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Caractéristiques
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {product.madeInFranceLevel && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <Factory className="h-6 w-6 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">Fabrication</p>
                  <p className="font-semibold text-gray-900">{getMadeInFranceLabel(product.madeInFranceLevel)}</p>
                </div>
              )}
              {product.manufacturingLocation && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <MapPin className="h-6 w-6 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">Lieu de fabrication</p>
                  <p className="font-semibold text-gray-900">{product.manufacturingLocation}</p>
                </div>
              )}
              {product.materials?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <Package className="h-6 w-6 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-500 mb-1">Matériaux</p>
                  <p className="font-semibold text-gray-900">{product.materials.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Produits similaires */}
        {similarProducts.length > 0 && (
          <div className="mt-16 border-t pt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Autres produits de {product.brand.name}
              </h2>
              <Link 
                href={`/marques/${product.brand.slug}`}
                className="text-sm font-medium hover:underline hidden md:block"
                style={{ color: sectorColor }}
              >
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/produits/${p.slug}`}
                  className="group"
                >
                  <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                        style={{ backgroundColor: sectorColor }}
                      >
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600 transition-colors mb-1">
                    {p.name}
                  </h3>
                  {p.priceMin && (
                    <p className="font-semibold" style={{ color: sectorColor }}>
                      {formatPrice(p.priceMin, p.priceMax)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center md:hidden">
              <Link 
                href={`/marques/${product.brand.slug}`}
                className="text-sm font-medium hover:underline"
                style={{ color: sectorColor }}
              >
                Voir tous les produits →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar mobile */}
      {buyUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 lg:hidden z-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 line-clamp-1">{product.name}</p>
              <p className="font-bold text-lg">{formatPrice(product.priceMin, product.priceMax)}</p>
            </div>
            <Button
              size="lg"
              className="btn-buy-shimmer text-white px-8 rounded-xl"
              style={{ backgroundColor: sectorColor }}
              asChild
            >
              <a href={buyUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Acheter
              </a>
            </Button>
          </div>
        </div>
      )}
      
      {/* Spacer for sticky bar */}
      <div className="h-24 lg:hidden"></div>
    </div>
  );
}
