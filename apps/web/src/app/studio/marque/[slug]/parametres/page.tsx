'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconPicker, IconName, getIconComponent } from '@/components/ui/icon-picker';
import {
  Building2,
  BarChart3,
  Package,
  Settings,
  ArrowLeft,
  Save,
  Upload,
  X,
  Lock,
  Crown,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  Award,
  TrendingUp,
  Loader2,
  BookOpen,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Check,
  FileText,
  Video,
  RefreshCw,
  Navigation
} from 'lucide-react';
import { RichEditor } from '@/components/ui/rich-editor';

const API_URL = 'http://localhost:4000';

type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ROYALE';

interface ContentSection {
  id: string;
  title: string;
  icon: IconName;
  content: string;
  visible: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  descriptionShort: string | null;
  descriptionLong: string | null;
  story: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  videoUrl: string | null;
  yearFounded: number | null;
  subscriptionTier: SubscriptionTier;
  sectorId: string | null;
  regionId: string | null;
  sector: { id: string; name: string; color: string } | null;
  region: { id: string; name: string } | null;
  galleryUrls: string[];
  socialLinks: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  } | null;
  status: string;
  isFeatured: boolean;
  isVerified: boolean;
  aiGeneratedContent?: {
    sections?: ContentSection[];
    tags?: string[];
  };
}

interface Sector {
  id: string;
  name: string;
  color: string;
}

interface Region {
  id: string;
  name: string;
}

const PLAN_FEATURES = {
  FREE: {
    maxPhotos: 1,
    videoUrl: false,
    socialLinks: false,
    seoFields: false,
    story: false,
    sections: false,
  },
  PREMIUM: {
    maxPhotos: 10,
    videoUrl: true,
    socialLinks: true,
    seoFields: true,
    story: true,
    sections: true,
  },
  ROYALE: {
    maxPhotos: 50,
    videoUrl: true,
    socialLinks: true,
    seoFields: true,
    story: true,
    sections: true,
  },
};

const PLAN_NAMES: Record<SubscriptionTier, string> = {
  FREE: 'Gratuit',
  PREMIUM: 'Premium',
  ROYALE: 'Royale',
};

const PLAN_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'bg-slate-600',
  PREMIUM: 'bg-blue-600',
  ROYALE: 'bg-amber-500',
};

const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/...' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: Globe, placeholder: 'https://tiktok.com/@...' },
];

const getLogoUrl = (brand: Partial<Brand>): string | null => {
  if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com')) {
    return brand.logoUrl;
  }
  if (brand.websiteUrl) {
    try {
      const hostname = new URL(brand.websiteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return null;
    }
  }
  return null;
};

// Composant carte simple avec iframe OpenStreetMap
function SimpleMap({ latitude, longitude, address, city }: { latitude: number | null; longitude: number | null; address: string | null; city: string | null }) {
  if (!latitude || !longitude) {
    return (
      <div className="h-64 bg-slate-700 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Aucune coordonnées disponibles</p>
          <p className="text-slate-500 text-xs mt-1">Renseignez l'adresse et géolocalisez</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-slate-600">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
        style={{ border: 0 }}
      />
    </div>
  );
}

export default function StudioParametresPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // Refs pour upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // États principaux
  const [brand, setBrand] = useState<Partial<Brand>>({
    name: '',
    descriptionShort: '',
    descriptionLong: '',
    story: '',
    websiteUrl: '',
    city: '',
    address: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    yearFounded: null,
    email: '',
    phone: '',
    socialLinks: {},
    galleryUrls: [],
    status: 'ACTIVE',
    isFeatured: false,
    isVerified: false,
  });

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'seo' | 'preview'>('edit');

  // Sections de contenu
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [brandTags, setBrandTags] = useState<string[]>([]);

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Modal réseaux sociaux
  const [showSocialModal, setShowSocialModal] = useState(false);

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Géolocalisation
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/studio/connexion');
      return;
    }

    if (slug) {
      loadData();
    }
  }, [slug, status]);

  const loadData = async () => {
    try {
      const [sectorsRes, regionsRes, brandRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/sectors`),
        fetch(`${API_URL}/api/v1/regions`),
        fetch(`${API_URL}/api/v1/brands/${slug}`),
      ]);

      const sectorsData = await sectorsRes.json();
      const regionsData = await regionsRes.json();
      const brandData = await brandRes.json();

      setSectors(sectorsData.data || []);
      setRegions(regionsData.data || []);

      const b = brandData.data || brandData;
      setBrand({
        ...b,
        galleryUrls: b.galleryUrls || [],
        socialLinks: b.socialLinks || {},
      });

      // Charger sections
      const aiContent = b.aiGeneratedContent || {};
      if (aiContent.sections && aiContent.sections.length > 0) {
        setSections(aiContent.sections);
      } else {
        const initialSections: ContentSection[] = [];
        if (b.story) {
          initialSections.push({
            id: crypto.randomUUID(),
            title: "L'histoire",
            icon: 'BookOpen' as IconName,
            content: b.story,
            visible: true,
          });
        }
        if (b.descriptionLong) {
          initialSections.push({
            id: crypto.randomUUID(),
            title: "Description détaillée",
            icon: 'Award',
            content: b.descriptionLong,
            visible: true,
          });
        }
        setSections(initialSections);
      }

      setBrandTags(aiContent.tags || []);
      setSeoTitle(b.seoTitle || '');
      setSeoDescription(b.seoDescription || '');

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Brand, value: any) => {
    setBrand(prev => ({ ...prev, [field]: value }));
  };

  // Géocodage de l'adresse
  const geocodeAddress = async () => {
    const fullAddress = [brand.address, brand.postalCode, brand.city, 'France']
      .filter(Boolean)
      .join(', ');

    if (!fullAddress || fullAddress === 'France') {
      setGeocodeError('Veuillez renseigner une adresse complète');
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MadeInFrance-Studio/1.0',
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setBrand(prev => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));
        setGeocodeError(null);
      } else {
        setGeocodeError('Adresse non trouvée. Vérifiez les informations.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodeError('Erreur lors de la géolocalisation');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = session?.user?.id;
      const res = await fetch(`${API_URL}/api/v1/brands/${slug}/dashboard?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brand,
          seoTitle,
          seoDescription,
          aiGeneratedContent: {
            sections,
            tags: brandTags,
          },
        }),
      });

      if (res.ok) {
        alert('Modifications enregistrées !');
        loadData();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Upload functions
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'logo');

    try {
      const res = await fetch(`${API_URL}/api/v1/brands/${slug}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBrand(prev => ({ ...prev, logoUrl: data.url }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'cover');

    try {
      const res = await fetch(`${API_URL}/api/v1/brands/${slug}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBrand(prev => ({ ...prev, coverImageUrl: data.url }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'photo');

      try {
        const res = await fetch(`${API_URL}/api/v1/brands/${slug}/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          newUrls.push(data.url);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setBrand(prev => ({
      ...prev,
      galleryUrls: [...(prev.galleryUrls || []), ...newUrls],
    }));
    setUploadingGallery(false);
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    setBrand(prev => ({
      ...prev,
      galleryUrls: (prev.galleryUrls || []).filter((_, i) => i !== index),
    }));
  };

  // Sections management
  const addSection = () => {
    setSections(prev => [...prev, {
      id: crypto.randomUUID(),
      title: 'Nouvelle section',
      icon: 'BookOpen',
      content: '',
      visible: true,
    }]);
  };

  const updateSection = (id: string, field: keyof ContentSection, value: string | boolean) => {
    setSections(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const removeSection = (id: string) => {
    if (confirm('Supprimer cette section ?')) {
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  // Social links
  const updateSocialLink = (key: string, value: string) => {
    setBrand(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const removeSocialLink = (key: string) => {
    setBrand(prev => {
      const newLinks = { ...prev.socialLinks };
      delete newLinks[key as keyof typeof newLinks];
      return { ...prev, socialLinks: newLinks };
    });
  };

  const currentPlan = (brand.subscriptionTier as SubscriptionTier) || 'FREE';
  const features = PLAN_FEATURES[currentPlan];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Marque non trouvée</h1>
          <Link href="/studio" className="text-blue-400 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = getLogoUrl(brand);
  const activeSocialLinks = Object.entries(brand.socialLinks || {}).filter(([_, v]) => v);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Inputs cachés pour upload */}
      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <Link href="/studio" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">MiF</span>
                <span className="text-lg font-light text-blue-400 ml-1">Studio</span>
              </div>
            </Link>
          </div>

          {/* Brand info */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={brand.name || ''} className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{brand.name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${PLAN_COLORS[currentPlan]}`}>
                  {currentPlan === 'ROYALE' && <Crown className="w-3 h-3" />}
                  {currentPlan === 'PREMIUM' && <Star className="w-3 h-3" />}
                  {PLAN_NAMES[currentPlan]}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link
              href={`/studio/marque/${slug}`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <BarChart3 className="w-5 h-5" />
              Tableau de bord
            </Link>
            <Link
              href={`/studio/marque/${slug}/statistiques`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </Link>
            <Link
              href={`/studio/marque/${slug}/produits`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <Package className="w-5 h-5" />
              Produits
            </Link>
            <Link
              href={`/studio/marque/${slug}/labels`}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition"
            >
              <Award className="w-5 h-5" />
              Labels
            </Link>
            <Link
              href={`/studio/marque/${slug}/parametres`}
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 text-blue-400 rounded-xl"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </Link>
          </nav>

          {/* Upgrade CTA */}
          {currentPlan === 'FREE' && (
            <div className="p-4 border-t border-slate-700">
              <Link
                href={`/studio/marque/${slug}/abonnement`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                <Star className="w-5 h-5" />
                Passer Premium
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/studio/marque/${slug}`} className="text-slate-400 hover:text-white lg:hidden">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">Modifier la fiche</h1>
                <p className="text-sm text-slate-400">/{brand.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/marques/${brand.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                Voir la page
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-slate-800 border-b border-slate-700 px-6">
          <nav className="flex gap-6">
            {[
              { id: 'edit', label: 'Édition', icon: Pencil },
              { id: 'seo', label: 'SEO', icon: Globe },
              { id: 'preview', label: 'Aperçu', icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <main className="p-6">
          {/* Onglet Édition */}
          {activeTab === 'edit' && (
            <div className="space-y-6">
              {/* Couverture + Logo */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {/* Couverture */}
                <div
                  className="h-48 relative bg-gradient-to-br from-blue-600 to-purple-700"
                  style={brand.coverImageUrl ? {
                    backgroundImage: `url(${brand.coverImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition"
                  >
                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="text-sm font-medium">Changer la couverture</span>
                  </button>

                  {/* Logo */}
                  <div className="absolute -bottom-12 left-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-slate-700 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-slate-800">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-2xl font-bold text-white">{brand.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition"
                      >
                        {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulaire principal */}
                <div className="pt-16 px-8 pb-8">
                  <div className="flex flex-col lg:flex-row lg:gap-8">
                    {/* Colonne gauche */}
                    <div className="flex-1 space-y-6">
                      {/* Nom */}
                      <div>
                        <input
                          type="text"
                          value={brand.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          className="text-2xl font-bold text-white bg-transparent border-b-2 border-transparent hover:border-slate-600 focus:border-blue-500 outline-none w-full py-2 transition"
                          placeholder="Nom de la marque"
                        />
                      </div>

                      {/* Secteur & Région */}
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={brand.sectorId || ''}
                          onChange={(e) => updateField('sectorId', e.target.value || null)}
                          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm"
                        >
                          <option value="">Choisir un secteur</option>
                          {sectors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>

                        <select
                          value={brand.regionId || ''}
                          onChange={(e) => updateField('regionId', e.target.value || null)}
                          className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm"
                        >
                          <option value="">Choisir une région</option>
                          {regions.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Description courte */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description courte</label>
                        <textarea
                          value={brand.descriptionShort || ''}
                          onChange={(e) => updateField('descriptionShort', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Une phrase qui décrit votre entreprise..."
                        />
                      </div>

                      {/* Localisation */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          Localisation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={brand.address || ''}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="Adresse"
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400"
                          />
                          <input
                            type="text"
                            value={brand.postalCode || ''}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            placeholder="Code postal"
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400"
                          />
                          <input
                            type="text"
                            value={brand.city || ''}
                            onChange={(e) => updateField('city', e.target.value)}
                            placeholder="Ville"
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400"
                          />
                        </div>

                        {/* Bouton géolocalisation + carte */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={geocodeAddress}
                              disabled={geocoding}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-white text-sm transition"
                            >
                              {geocoding ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Navigation className="w-4 h-4" />
                              )}
                              Géolocaliser l'adresse
                            </button>
                            {brand.latitude && brand.longitude && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Coordonnées: {brand.latitude.toFixed(4)}, {brand.longitude.toFixed(4)}
                              </span>
                            )}
                          </div>
                          {geocodeError && (
                            <p className="text-sm text-red-400">{geocodeError}</p>
                          )}

                          {/* Carte de prévisualisation */}
                          <SimpleMap
                            latitude={brand.latitude || null}
                            longitude={brand.longitude || null}
                            address={brand.address || null}
                            city={brand.city || null}
                          />
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-400" />
                          Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="email"
                              value={brand.email || ''}
                              onChange={(e) => updateField('email', e.target.value)}
                              placeholder="Email"
                              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400"
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              value={brand.phone || ''}
                              onChange={(e) => updateField('phone', e.target.value)}
                              placeholder="Téléphone"
                              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sections de contenu avec RichEditor */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Sections de contenu</h3>
                          {features.sections ? (
                            <button
                              onClick={addSection}
                              className="text-blue-400 hover:bg-blue-600/20 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter une section
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">Premium</span>
                          )}
                        </div>

                        {features.sections ? (
                          sections.length === 0 ? (
                            <div
                              onClick={addSection}
                              className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
                            >
                              <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                              <p className="text-sm text-slate-400">Cliquez pour ajouter une section</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
  {sections.map((section) => (
    <div key={section.id} className="bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden">
      <div className="bg-slate-700 px-4 py-3 flex items-center gap-3">
        <IconPicker
          value={section.icon}
          onChange={(icon) => updateSection(section.id, 'icon', icon)}
          color="#3b82f6"
        />
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
          placeholder="Titre de la section"
        />
        <button
          onClick={() => updateSection(section.id, 'visible', !section.visible)}
          className={`p-2 rounded-lg ${section.visible ? 'text-green-400' : 'text-slate-400'}`}
        >
          {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={() => removeSection(section.id)}
          className="p-2 rounded-lg text-red-400 hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <RichEditor
          content={section.content}
          onChange={(content) => updateSection(section.id, 'content', content)}
          placeholder="Contenu de la section..."
        />
      </div>
    </div>
  ))}
</div>
                          )
                        ) : (
                          <div className="relative">
                            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 opacity-50">
                              <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                              <p className="text-sm text-slate-400 text-center">Sections de contenu</p>
                            </div>
                            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <div className="text-center p-4">
                                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-400 mb-2">Fonctionnalité Premium</p>
                                <Link
                                  href={`/studio/marque/${slug}/abonnement`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                                >
                                  <Star className="w-4 h-4" />
                                  Débloquer
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Galerie photos */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-400" />
                            Galerie photos ({(brand.galleryUrls || []).length}/{features.maxPhotos})
                          </h3>
                          <button
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={uploadingGallery || (brand.galleryUrls || []).length >= features.maxPhotos}
                            className="text-blue-400 hover:bg-blue-600/20 px-3 py-1 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Ajouter
                          </button>
                        </div>

                        {(brand.galleryUrls || []).length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {(brand.galleryUrls || []).map((url, index) => (
                              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-700">
                                <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeGalleryImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            onClick={() => galleryInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition"
                          >
                            <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Cliquez pour ajouter des photos</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Colonne droite (sidebar) */}
                    <div className="lg:w-80 space-y-6 mt-6 lg:mt-0">
                      {/* Site web */}
                      <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          Site web
                        </h3>
                        <input
                          type="url"
                          value={brand.websiteUrl || ''}
                          onChange={(e) => updateField('websiteUrl', e.target.value)}
                          placeholder="https://www.exemple.fr"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-xl text-white text-sm placeholder-slate-400"
                        />
                        {brand.websiteUrl && (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                          >
                            Visiter le site <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Réseaux sociaux */}
                      <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">Réseaux sociaux</h3>
                          {features.socialLinks ? (
                            <button
                              onClick={() => setShowSocialModal(true)}
                              className="text-blue-400 hover:bg-blue-600/20 p-1 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">Premium</span>
                          )}
                        </div>

                        {features.socialLinks ? (
                          activeSocialLinks.length > 0 ? (
                            <div className="space-y-2">
                              {activeSocialLinks.map(([key, value]) => {
                                const network = SOCIAL_NETWORKS.find(n => n.key === key);
                                if (!network) return null;
                                const Icon = network.icon;
                                return (
                                  <div key={key} className="flex items-center gap-2">
                                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <input
                                      type="url"
                                      value={value as string}
                                      onChange={(e) => updateSocialLink(key, e.target.value)}
                                      placeholder={network.placeholder}
                                      className="flex-1 px-3 py-1.5 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm min-w-0"
                                    />
                                    <button
                                      onClick={() => removeSocialLink(key)}
                                      className="text-red-400 hover:bg-red-500/20 p-1 rounded flex-shrink-0"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">Aucun réseau social configuré</p>
                          )
                        ) : (
                          <div className="text-center py-4">
                            <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">Passez Premium pour débloquer</p>
                          </div>
                        )}
                      </div>

                      {/* Année de fondation */}
                      <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Année de fondation
                        </h3>
                        <input
                          type="number"
                          value={brand.yearFounded || ''}
                          onChange={(e) => updateField('yearFounded', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Ex: 1985"
                          min="1800"
                          max={new Date().getFullYear()}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-xl text-white text-sm"
                        />
                      </div>

                      {/* Vidéo */}
                      <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-400" />
                            Vidéo
                          </h3>
                          {!features.videoUrl && (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">Premium</span>
                          )}
                        </div>
                        {features.videoUrl ? (
                          <input
                            type="url"
                            value={brand.videoUrl || ''}
                            onChange={(e) => updateField('videoUrl', e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-xl text-white text-sm"
                          />
                        ) : (
                          <div className="text-center py-4">
                            <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">Passez Premium pour débloquer</p>
                          </div>
                        )}
                      </div>

                      {/* Tags IA */}
                      <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          🤖 Tags pour l'IA
                        </h3>
                        <p className="text-xs text-slate-400">Ces tags aident l'IA à trouver votre marque</p>
                        <div className="flex flex-wrap gap-2">
                          {brandTags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm"
                            >
                              {tag}
                              <button onClick={() => setBrandTags(prev => prev.filter((_, i) => i !== index))}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Ajouter un tag (Entrée)"
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              const value = input.value.trim();
                              if (value && !brandTags.includes(value)) {
                                setBrandTags(prev => [...prev, value]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-lg font-semibold text-white">Référencement (SEO)</h2>
                  {!features.seoFields && (
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">Premium</span>
                  )}
                </div>

                {features.seoFields ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Titre SEO</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                        placeholder="Titre optimisé pour les moteurs de recherche"
                      />
                      <p className="text-xs text-slate-500 mt-1">{seoTitle.length}/60 caractères recommandés</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description SEO</label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                        placeholder="Description qui apparaîtra dans les résultats de recherche"
                      />
                      <p className="text-xs text-slate-500 mt-1">{seoDescription.length}/160 caractères recommandés</p>
                    </div>

                    {/* Aperçu Google */}
                    <div className="mt-6 p-4 bg-slate-900 rounded-xl">
                      <p className="text-xs text-slate-500 mb-2">Aperçu dans Google</p>
                      <div className="text-blue-400 text-lg hover:underline cursor-pointer">
                        {seoTitle || brand.name}
                      </div>
                      <div className="text-green-500 text-sm">
                        madeinfrance.fr › marques › {slug}
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {seoDescription || brand.descriptionShort || 'Découvrez cette marque française...'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="space-y-4 opacity-30">
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">Titre SEO</label>
                        <input type="text" disabled className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">Description SEO</label>
                        <textarea disabled rows={3} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <div className="text-center p-4">
                        <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 mb-2">Fonctionnalité Premium</p>
                        <Link
                          href={`/studio/marque/${slug}/abonnement`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        >
                          <Star className="w-4 h-4" />
                          Débloquer
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Aperçu */}
          {activeTab === 'preview' && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Aperçu de la page</h3>
                <p className="text-slate-400 mb-6">Visualisez votre fiche telle qu'elle apparaîtra aux visiteurs</p>
                <Link
                  href={`/marques/${brand.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                  Ouvrir la page publique
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Réseaux Sociaux */}
      {showSocialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Ajouter un réseau social</h3>
              <button onClick={() => setShowSocialModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {SOCIAL_NETWORKS.map(network => {
                const Icon = network.icon;
                const isActive = brand.socialLinks?.[network.key as keyof typeof brand.socialLinks];
                return (
                  <button
                    key={network.key}
                    onClick={() => {
                      if (!isActive) {
                        updateSocialLink(network.key, '');
                      }
                      setShowSocialModal(false);
                    }}
                    disabled={!!isActive}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{network.label}</span>
                    {isActive && <Check className="w-4 h-4 ml-auto text-green-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
