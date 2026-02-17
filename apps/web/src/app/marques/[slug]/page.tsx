'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  ExternalLink, 
  Globe, 
  Instagram, 
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Calendar,
  CheckCircle,
  Star,
  Factory,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { getIconComponent } from '@/components/ui/icon-picker';

// Composant pour les produits
function ProductsSection({ brandSlug, sectorColor }: { brandSlug: string; sectorColor: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/brands/${brandSlug}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [brandSlug]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <h2 className="text-xl font-semibold text-france-blue mb-6">Produits</h2>
        <div className="text-gray-500">Chargement des produits...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-france-blue">
          Produits ({products.length})
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.slice(0, 9).map((product) => (
          <Link
            key={product.id}
            href={`/produits/${product.slug}`}
            className="group block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-soft-lg hover:border-transparent transition-all"
          >
            {product.imageUrl ? (
              <div className="aspect-square bg-gray-50">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                />
              </div>
            ) : (
              <div
                className="aspect-square flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: sectorColor }}
              >
                {product.name.charAt(0)}
              </div>
            )}
            <div className="p-3">
              <h3 className="font-medium text-france-blue text-sm line-clamp-2 group-hover:text-france-red transition-colors">
                {product.name}
              </h3>
              {product.priceMin && (
                <p className="text-sm font-semibold mt-1" style={{ color: sectorColor }}>
                  {product.priceMin === product.priceMax || !product.priceMax
                    ? `${product.priceMin.toFixed(2)} €`
                    : `${product.priceMin.toFixed(2)} - ${product.priceMax.toFixed(2)} €`
                  }
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {products.length > 9 && (
        <div className="mt-6 text-center">
          <Link
            href={`/marques/${brandSlug}/produits`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all hover:shadow-lg hover:scale-105"
            style={{ backgroundColor: sectorColor }}
          >
            Voir les {products.length} produits
          </Link>
        </div>
      )}
    </div>
  );
}

// Composant Galerie Photos
function GallerySection({ images, brandName, sectorColor }: { images: string[]; brandName: string; sectorColor: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <h2 className="text-xl font-semibold text-france-blue mb-6 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" style={{ color: sectorColor }} />
          Galerie photos ({images.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="aspect-square rounded-xl overflow-hidden bg-gray-100 hover:scale-105 transition-transform cursor-pointer"
            >
              <img
                src={url}
                alt={`${brandName} - Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}
          
          <img
            src={images[currentIndex]}
            alt={`${brandName} - Photo ${currentIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          
          <div className="absolute bottom-4 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

// Composant Section Vidéo
function VideoSection({ videoUrl, brandName, sectorColor }: { videoUrl: string; brandName: string; sectorColor: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
        <h3 className="font-semibold text-france-blue mb-4 flex items-center gap-2">
          <Youtube className="h-5 w-5" style={{ color: sectorColor }} />
          Vidéo
        </h3>
        <div
          className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <img
            src={thumbnailUrl}
            alt={`Vidéo ${brandName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 ml-0.5" fill={sectorColor} viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Vidéo */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2"
          >
            <X className="h-8 w-8" />
          </button>
          
          <div 
            className="relative z-10 w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={`Vidéo ${brandName}`}
              className="w-full h-full rounded-xl shadow-2xl"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  descriptionShort: string | null;
  descriptionLong: string | null;
  story: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[] | null;
  videoUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  yearFounded: number | null;
  employeeRange: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  region: { id: string; name: string; slug: string } | null;
  sector: { id: string; name: string; slug: string; color: string | null } | null;
  labels: { label: { id: string; name: string; slug: string } }[];
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  } | null;
  madeInFranceLevel: string;
  aiGeneratedContent: {
    sections?: Array<{
      id: string;
      title: string;
      icon: string;
      content: string;
      visible: boolean;
    }>;
  } | null;
}

interface SimilarBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  region: string | null;
  sector: string | null;
}

// Composant pour les sections avec "voir plus"
function SectionContent({ 
  section, 
  IconComponent, 
  sectorColor 
}: { 
  section: { id: string; title: string; content: string }; 
  IconComponent: any; 
  sectorColor: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = 24; // hauteur de ligne approximative
      const maxHeight = lineHeight * 7; // 7 lignes
      setNeedsExpansion(contentRef.current.scrollHeight > maxHeight);
    }
  }, [section.content]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
      <h2 className="text-xl font-semibold text-france-blue mb-4 flex items-center gap-2">
        <IconComponent className="h-5 w-5" style={{ color: sectorColor }} />
        {section.title}
      </h2>
      <div className="relative">
        <div
          ref={contentRef}
          className={`prose text-gray-600 max-w-none overflow-hidden transition-all duration-300 ${
            !isExpanded && needsExpansion ? 'max-h-[168px]' : 'max-h-none'
          }`}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
        {needsExpansion && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
        )}
      </div>
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-sm font-medium flex items-center gap-1 hover:underline transition-colors"
          style={{ color: sectorColor }}
        >
          {isExpanded ? (
            <>
              Voir moins
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Voir plus
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function MarqueDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [similarBrands, setSimilarBrands] = useState<SimilarBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const response = await fetch(`http://localhost:4000/api/v1/brands/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Marque non trouvée');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }
        const data = await response.json();
        setBrand(data.data);

        // Charger les marques similaires (même secteur)
        if (data.data.sector?.slug) {
          const similarRes = await fetch(`http://localhost:4000/api/v1/brands?sector=${data.data.sector.slug}&limit=4`);
          const similarData = await similarRes.json();
          setSimilarBrands(
            (similarData.data || [])
              .filter((b: SimilarBrand) => b.slug !== slug)
              .slice(0, 3)
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
      fetchBrand();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-france-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">MiF</span>
          </div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-france-cream">
        <div className="container py-12">
          <Link href="/marques" className="inline-flex items-center text-france-blue hover:text-france-red transition-colors mb-8 font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux marques
          </Link>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-france-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold text-france-blue mb-2">
              {error || 'Marque non trouvée'}
            </h1>
            <p className="text-gray-500">
              Cette marque n'existe pas ou a été supprimée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sectorColor = brand.sector?.color || '#002395';

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

  // Construire l'adresse complète
  const fullAddress = [brand.address, brand.postalCode, brand.city]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-france-cream">
      {/* Hero avec image de couverture ou couleur du secteur */}
      <div 
        className="relative"
        style={{ 
          backgroundColor: sectorColor,
          backgroundImage: brand.coverImageUrl ? `url(${brand.coverImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay sombre si image de couverture */}
        {brand.coverImageUrl && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        
        {/* Overlay pattern si pas d'image */}
        {!brand.coverImageUrl && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
        )}

        <div className="relative container py-8">
          <Link href="/marques" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux marques
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="w-28 h-28 bg-white rounded-2xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-3">
              {brand.logoUrl && !brand.logoUrl.includes('clearbit.com') ? (
                <img 
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              ) : brand.websiteUrl ? (
                <>
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(brand.websiteUrl).hostname}&sz=128`}
                    alt={brand.name}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (sibling) sibling.classList.remove('hidden');
                    }}
                  />
                  <span 
                    className="text-4xl font-bold hidden" 
                    style={{ color: sectorColor }}
                  >
                    {brand.name.charAt(0)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold" style={{ color: sectorColor }}>
                  {brand.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {brand.name}
                </h1>
                {brand.isVerified && (
                  <CheckCircle className="h-6 w-6 text-white" title="Marque vérifiée" />
                )}
                {brand.isFeatured && (
                  <Star className="h-6 w-6 text-yellow-300 fill-yellow-300" title="Marque en vedette" />
                )}
                <FavoriteButton 
                  brandId={brand.id} 
                  size="lg" 
                  className="ml-2"
                />
              </div>

              {brand.tagline && (
                <p className="text-xl text-white/90 mb-4">
                  {brand.tagline}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-6">
                {brand.city && (
                  <span className="flex items-center gap-1 text-white/90">
                    <MapPin className="h-4 w-4" />
                    {brand.city}
                    {brand.postalCode && ` (${brand.postalCode})`}
                  </span>
                )}
                {brand.yearFounded && (
                  <span className="flex items-center gap-1 text-white/90">
                    <Calendar className="h-4 w-4" />
                    Depuis {brand.yearFounded}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                {brand.sector && (
                  <Link 
                    href={`/secteurs/${brand.sector.slug}`}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    {brand.sector.name}
                  </Link>
                )}
                {brand.region && (
                  <Link 
                    href={`/regions/${brand.region.slug}`}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
                  >
                    {brand.region.name}
                  </Link>
                )}
                {brand.labels?.map((bl) => (
                  <span 
                    key={bl.label.id} 
                    className="bg-green-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
                  >
                    <Award className="h-3.5 w-3.5" />
                    {bl.label.name}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {brand.websiteUrl && (
                  <a 
                    href={brand.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/20 text-white font-medium hover:bg-gradient-to-r hover:from-[#002395] hover:via-white hover:to-[#ED2939] hover:text-gray-900 hover:scale-105 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                    Visiter le site
                  </a>
                )}
                {brand.socialLinks?.instagram && (
                  <a 
                    href={brand.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 flex items-center justify-center transition-all hover:scale-110"
                    title="Instagram"
                  >
                    <Instagram className="h-5 w-5 text-white" />
                  </a>
                )}
                {brand.socialLinks?.facebook && (
                  <a 
                    href={brand.socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-[#1877F2] flex items-center justify-center transition-all hover:scale-110"
                    title="Facebook"
                  >
                    <Facebook className="h-5 w-5 text-white" />
                  </a>
                )}
                {brand.socialLinks?.linkedin && (
                  <a 
                    href={brand.socialLinks.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-[#0A66C2] flex items-center justify-center transition-all hover:scale-110"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 text-white" />
                  </a>
                )}
                {brand.socialLinks?.youtube && (
                  <a 
                    href={brand.socialLinks.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-[#FF0000] flex items-center justify-center transition-all hover:scale-110"
                    title="YouTube"
                  >
                    <Youtube className="h-5 w-5 text-white" />
                  </a>
                )}
                {brand.socialLinks?.twitter && (
                  <a 
                    href={brand.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-black flex items-center justify-center transition-all hover:scale-110"
                    title="X (Twitter)"
                  >
                    <Twitter className="h-5 w-5 text-white" />
                  </a>
                )}
                {brand.socialLinks?.tiktok && (
                  <a 
                    href={brand.socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-white/20 hover:bg-black flex items-center justify-center transition-all hover:scale-110"
                    title="TikTok"
                  >
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Sections de contenu */}
            {brand.aiGeneratedContent?.sections?.filter(s => s.visible).map((section) => {
              const IconComponent = getIconComponent(section.icon as any);
              return (
                <SectionContent 
                  key={section.id}
                  section={section}
                  IconComponent={IconComponent}
                  sectorColor={sectorColor}
                />
              );
            })}

            {/* Fallback pour les anciennes marques sans sections */}
            {(!brand.aiGeneratedContent?.sections || brand.aiGeneratedContent.sections.length === 0) && brand.story && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
                <h2 className="text-xl font-semibold text-france-blue mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" style={{ color: sectorColor }} />
                  L'histoire de {brand.name}
                </h2>
                <div className="prose text-gray-600 max-w-none whitespace-pre-line">
                  {brand.story}
                </div>
              </div>
            )}

            {/* Produits */}
            <ProductsSection brandSlug={slug} sectorColor={sectorColor} />

            {/* Mini carte */}
            {brand.latitude && brand.longitude && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
                <h2 className="text-xl font-semibold text-france-blue mb-4">
                  Localisation
                </h2>
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${brand.longitude - 0.05}%2C${brand.latitude - 0.03}%2C${brand.longitude + 0.05}%2C${brand.latitude + 0.03}&layer=mapnik&marker=${brand.latitude}%2C${brand.longitude}`}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{fullAddress}</span>
                    </div>
                    {brand.region && (
                      <span className="text-sm text-gray-500 ml-6">{brand.region.name}</span>
                    )}
                  </div>
                  <Link 
                    href="/carte" 
                    className="text-france-blue hover:underline text-sm"
                  >
                    Voir sur la carte
                  </Link>
                </div>
              </div>
            )}

            {/* Marques similaires */}
            {similarBrands.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
                <h2 className="text-xl font-semibold text-france-blue mb-6">
                  Marques similaires
                </h2>
                <div className="grid gap-4">
                  {similarBrands.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/marques/${similar.slug}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-france-blue/20 hover:shadow-soft transition-all group"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: sectorColor }}
                      >
                        {similar.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-france-blue group-hover:text-france-red transition-colors">{similar.name}</h3>
                        <p className="text-sm text-gray-500">
                          {similar.city}{similar.region && ` • ${similar.region}`}
                        </p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/secteurs/${brand.sector?.slug}`}
                  className="inline-block mt-4 text-france-blue hover:text-france-red transition-colors text-sm font-medium"
                >
                  Voir toutes les marques {brand.sector?.name} →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Infos clés */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
              <h3 className="font-semibold text-france-blue mb-4">Informations</h3>
              <dl className="space-y-4">
                {brand.yearFounded && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-france-blue/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-france-blue" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Année de création</dt>
                      <dd className="text-france-blue font-medium">{brand.yearFounded}</dd>
                    </div>
                  </div>
                )}
                {(brand.address || brand.city) && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-france-blue/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-france-blue" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Adresse</dt>
                      <dd className="text-france-blue font-medium">
                        {brand.address && <div>{brand.address}</div>}
                        <div>
                          {brand.postalCode} {brand.city}
                        </div>
                        {brand.region && (
                          <div className="text-sm text-gray-500">{brand.region.name}</div>
                        )}
                      </dd>
                    </div>
                  </div>
                )}
                {brand.madeInFranceLevel && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-france-blue/10 flex items-center justify-center flex-shrink-0">
                      <Factory className="h-4 w-4 text-france-blue" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Fabrication</dt>
                      <dd className="text-france-blue font-medium">
                        {getMadeInFranceLabel(brand.madeInFranceLevel)}
                      </dd>
                    </div>
                  </div>
                )}
                {brand.employeeRange && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-france-blue/10 flex items-center justify-center flex-shrink-0">
                      <Factory className="h-4 w-4 text-france-blue" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Effectifs</dt>
                      <dd className="text-france-blue font-medium">{brand.employeeRange}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Labels */}
            {brand.labels && brand.labels.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
                <h3 className="font-semibold text-france-blue mb-4">Labels & Certifications</h3>
                <div className="space-y-3">
                  {brand.labels.map((bl) => (
                    <div
                      key={bl.label.id}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                    >
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">{bl.label.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Galerie photos */}
            {brand.galleryUrls && brand.galleryUrls.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
                <h3 className="font-semibold text-france-blue mb-4">Galerie photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {brand.galleryUrls.slice(0, 4).map((url, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setLightboxOpen(true);
                      }}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 transition-transform hover:scale-105"
                    >
                      <img
                        src={url}
                        alt={`${brand.name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {brand.galleryUrls.length > 4 && (
                  <button 
                    onClick={() => {
                      setCurrentImageIndex(0);
                      setLightboxOpen(true);
                    }}
                    className="text-sm text-france-blue hover:underline mt-2 w-full text-center"
                  >
                    Voir les {brand.galleryUrls.length} photos
                  </button>
                )}
              </div>
            )}

            {/* Vidéo */}
{brand.videoUrl && (
  <VideoSection 
    videoUrl={brand.videoUrl} 
    brandName={brand.name} 
    sectorColor={sectorColor} 
  />
)}

            {/* CTA */}
            {brand.websiteUrl && (
              <div 
                className="rounded-2xl p-6 text-white"
                style={{ backgroundColor: sectorColor }}
              >
                <h3 className="font-semibold mb-2">Découvrir {brand.name}</h3>
                <p className="text-white/80 text-sm mb-4">
                  Visitez le site officiel pour découvrir tous leurs produits Made in France.
                </p>
                <Button className="w-full bg-white hover:bg-gray-100" style={{ color: sectorColor }} asChild>
                  <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visiter le site
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && brand.galleryUrls && brand.galleryUrls.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2"
          >
            <X className="h-8 w-8" />
          </button>
          
          {brand.galleryUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => 
                  prev === 0 ? brand.galleryUrls!.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/30 rounded-full"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}
          
          <div 
            className="relative z-10 max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={brand.galleryUrls[currentImageIndex]}
              alt={`${brand.name} - Photo ${currentImageIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
          
          {brand.galleryUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => 
                  prev === brand.galleryUrls!.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/30 rounded-full"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {brand.galleryUrls.length}
          </div>
        </div>
      )}
    </div>
  );
}