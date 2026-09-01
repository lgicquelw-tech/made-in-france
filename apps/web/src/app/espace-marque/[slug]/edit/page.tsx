'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Plus,
  X,
  Upload,
  ExternalLink,
  Pencil,
  Package,
  Trash2,
  Image as ImageIcon,
  Loader2,
  BookOpen,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Star,
  Mail
} from 'lucide-react';
import { RichEditor } from '@/components/ui/rich-editor';
import { IconPicker, IconName } from '@/components/ui/icon-picker';

const API_URL = 'http://localhost:4000';

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
  descriptionShort: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  galleryUrls: string[];
  websiteUrl: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  yearFounded: number | null;
  email: string | null;
  phone: string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  } | null;
  sector: { id: string; name: string; color: string } | null;
  region: { id: string; name: string } | null;
  aiGeneratedContent?: {
    sections?: ContentSection[];
    tags?: string[];
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  imageUrl: string | null;
  galleryUrls: string[];
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  externalBuyUrl: string | null;
  status: string;
  isFeatured: boolean;
}

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

export default function EditBrandOwnerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const slug = params.slug as string;

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<Partial<Brand>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'sections' | 'photos' | 'products' | 'social'>('info');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Modal produit
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const [sections, setSections] = useState<ContentSection[]>([]);
  const [brandTags, setBrandTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const updateField = (field: keyof Brand, value: any) => {
    setBrand(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) {
      setError('Vous devez être connecté');
      setLoading(false);
      return;
    }
    loadData();
  }, [session, sessionStatus, slug]);

  const loadData = async () => {
    try {
      const dashboardRes = await fetch(
        `${API_URL}/api/v1/brands/${slug}/dashboard?userId=${session?.user?.id}`
      );

      if (!dashboardRes.ok) {
        if (dashboardRes.status === 403) {
          setError('Vous n\'êtes pas autorisé à modifier cette marque');
        } else if (dashboardRes.status === 404) {
          setError('Marque non trouvée');
        } else {
          setError('Erreur lors du chargement');
        }
        setLoading(false);
        return;
      }

      const dashboardData = await dashboardRes.json();
      setBrand(dashboardData.brand);
      setUserRole(dashboardData.userRole);

      const aiContent = dashboardData.brand.aiGeneratedContent || {};
      if (aiContent.sections && aiContent.sections.length > 0) {
        setSections(aiContent.sections);
      }
      setBrandTags(aiContent.tags || []);

      const productsRes = await fetch(`${API_URL}/api/v1/brands/${slug}/products/all`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur de connexion');
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/upload?folder=${folder}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.data.url;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const url = await uploadFile(file, 'brands/logos');
    if (url) setBrand(prev => ({ ...prev, logoUrl: url }));
    setUploadingLogo(false);
    e.target.value = '';
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadFile(file, 'brands/covers');
    if (url) setBrand(prev => ({ ...prev, coverImageUrl: url }));
    setUploadingCover(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'brands/gallery');
      if (url) newUrls.push(url);
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

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/brands/${slug}/dashboard?userId=${session.user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...brand,
            aiGeneratedContent: {
              ...(brand.aiGeneratedContent || {}),
              sections: sections,
              tags: brandTags,
            },
          }),
        }
      );
      if (res.ok) {
        alert('Modifications enregistrées !');
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setSections(prev => [...prev, {
      id: crypto.randomUUID(),
      title: 'Nouvelle section',
      icon: 'BookOpen' as IconName,
      content: '',
      visible: true,
    }]);
  };

  const updateSection = (id: string, field: keyof ContentSection, value: string | boolean) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const toggleSectionVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const removeSection = (id: string) => {
    if (confirm('Supprimer cette section ?')) {
      setSections(prev => prev.filter(s => s.id !== id));
    }
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setSections(prev => {
      const newSections = [...prev];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      return newSections;
    });
  };

  const moveSectionDown = (index: number) => {
    setSections(prev => {
      if (index === prev.length - 1) return prev;
      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      return newSections;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !brandTags.includes(newTag.trim())) {
      setBrandTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setBrandTags(prev => prev.filter(t => t !== tag));
  };

  const updateSocialLink = (key: string, value: string) => {
    setBrand(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const toggleProductFeatured = async (productId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/toggle-featured`, { method: 'PUT' });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p));
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const toggleProductStatus = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
        setShowProductModal(false);
        setEditingProduct(null);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingProduct(false);
    }
  };

  const updateProduct = (field: keyof Product, value: any) => {
    setEditingProduct(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || userRole === 'VIEWER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-6">{error || 'Permissions insuffisantes'}</p>
          <Link href={`/espace-marque/${slug}`} className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const logoUrl = getLogoUrl(brand);

  return (
    <div className="min-h-screen bg-gray-100">
      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />

      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/espace-marque/${slug}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">Modifier : {brand.name}</h1>
              <p className="text-sm text-gray-500">Espace marque</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/marques/${slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Eye className="w-4 h-4" /> Prévisualiser
            </Link>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="h-48 relative bg-gradient-to-br from-blue-600 to-blue-800" style={brand.coverImageUrl ? { backgroundImage: `url(${brand.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
              <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-lg px-3 py-2 flex items-center gap-2 shadow">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-sm">Couverture</span>
              </button>
              <div className="absolute -bottom-12 left-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-2xl font-bold text-gray-400">{brand.name?.charAt(0)}</span>}
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700">
                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-16 pb-4 px-6">
              <h2 className="text-xl font-bold text-gray-900">{brand.name}</h2>
              {brand.sector && <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: brand.sector.color }}>{brand.sector.name}</span>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="flex border-b overflow-x-auto">
              {[
                { id: 'info', label: 'Informations', icon: Mail },
                { id: 'sections', label: 'Sections', icon: BookOpen },
                { id: 'photos', label: 'Photos', icon: ImageIcon },
                { id: 'products', label: `Produits (${products.length})`, icon: Package },
                { id: 'social', label: 'Réseaux', icon: Globe },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description courte</label>
                    <textarea value={brand.descriptionShort || ''} onChange={(e) => updateField('descriptionShort', e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Description de votre marque..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" value={brand.email || ''} onChange={(e) => updateField('email', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="contact@marque.fr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input type="tel" value={brand.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="01 23 45 67 89" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                    <input type="url" value={brand.websiteUrl || ''} onChange={(e) => updateField('websiteUrl', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://www.marque.fr" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                      <input type="text" value={brand.address || ''} onChange={(e) => updateField('address', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="123 rue..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                      <input type="text" value={brand.postalCode || ''} onChange={(e) => updateField('postalCode', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="75001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                      <input type="text" value={brand.city || ''} onChange={(e) => updateField('city', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Paris" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année de création</label>
                    <input type="number" value={brand.yearFounded || ''} onChange={(e) => updateField('yearFounded', parseInt(e.target.value) || null)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="1990" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (pour l'IA)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {brandTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-4 py-2 border rounded-lg" placeholder="Ajouter un tag..." />
                      <button onClick={addTag} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sections' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Créez des sections pour présenter votre marque.</p>
                    <button onClick={addSection} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> Ajouter</button>
                  </div>
                  {sections.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune section</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map((section, index) => (
                        <div key={section.id} className={`border rounded-xl p-4 ${!section.visible ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-4 mb-4">
                            <IconPicker value={section.icon} onChange={(icon) => updateSection(section.id, 'icon', icon)} />
                            <input type="text" value={section.title} onChange={(e) => updateSection(section.id, 'title', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg font-medium" placeholder="Titre" />
                            <div className="flex items-center gap-1">
                              <button onClick={() => moveSectionUp(index)} disabled={index === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                              <button onClick={() => moveSectionDown(index)} disabled={index === sections.length - 1} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                              <button onClick={() => toggleSectionVisibility(section.id)} className="p-2 hover:bg-gray-100 rounded">{section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                              <button onClick={() => removeSection(section.id)} className="p-2 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <RichEditor content={section.content} onChange={(content) => updateSection(section.id, 'content', content)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Ajoutez des photos de votre marque.</p>
                    <button onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Ajouter
                    </button>
                  </div>
                  {(brand.galleryUrls || []).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune photo</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(brand.galleryUrls || []).map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                          <button onClick={() => removeGalleryImage(index)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Gérez vos produits et mettez-les en avant.</p>
                    <div className="flex gap-2">
                      {products.some(p => p.status === 'ACTIVE') && (
                        <button
                          onClick={async () => {
                            for (const product of products.filter(p => p.status === 'ACTIVE')) {
                              await fetch(`${API_URL}/api/admin/products/${product.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'DRAFT' }),
                              });
                            }
                            setProducts(prev => prev.map(p => ({ ...p, status: 'DRAFT' })));
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <EyeOff className="w-4 h-4" />
                          Tout masquer ({products.filter(p => p.status === 'ACTIVE').length})
                        </button>
                      )}
                      {products.some(p => p.status !== 'ACTIVE') && (
                        <button
                          onClick={async () => {
                            for (const product of products.filter(p => p.status !== 'ACTIVE')) {
                              await fetch(`${API_URL}/api/admin/products/${product.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'ACTIVE' }),
                              });
                            }
                            setProducts(prev => prev.map(p => ({ ...p, status: 'ACTIVE' })));
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4" />
                          Tout rendre visible ({products.filter(p => p.status !== 'ACTIVE').length})
                        </button>
                      )}
                    </div>
                  </div>
                  {products.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucun produit</p>
                      <p className="text-sm text-gray-500 mt-2">Les produits sont importés automatiquement depuis votre site.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {products.map(product => (
                        <div key={product.id} className={`flex items-center gap-4 p-4 rounded-xl ${product.status === 'ACTIVE' ? 'bg-gray-50' : 'bg-red-50 opacity-60'}`}>
                          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-500">
                              {product.priceMin ? `${product.priceMin}€` : 'Prix non défini'}
                              {product.priceMax && product.priceMax !== product.priceMin && ` - ${product.priceMax}€`}
                              {product.status !== 'ACTIVE' && <span className="ml-2 text-red-600">(Masqué)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleProductStatus(product.id)} className={`p-2 rounded-lg transition ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`} title={product.status === 'ACTIVE' ? 'Masquer' : 'Rendre visible'}>
                              {product.status === 'ACTIVE' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                            <button onClick={() => toggleProductFeatured(product.id)} className={`p-2 rounded-lg transition ${product.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:text-yellow-600'}`} title={product.isFeatured ? 'Retirer des tendances' : 'Mettre en tendance'}>
                              <Star className={`w-5 h-5 ${product.isFeatured ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }} className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg" title="Modifier">
                              <Pencil className="w-5 h-5" />
                            </button>
                            <Link href={`/produits/${product.slug}`} target="_blank" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                              <ExternalLink className="w-5 h-5 text-gray-600" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <p className="text-gray-600">Ajoutez vos liens vers les réseaux sociaux.</p>
                  <div className="space-y-4">
                    {SOCIAL_NETWORKS.map(network => {
                      const Icon = network.icon;
                      const value = brand.socialLinks?.[network.key as keyof typeof brand.socialLinks] || '';
                      return (
                        <div key={network.key} className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-gray-600" /></div>
                          <input type="url" value={value} onChange={(e) => updateSocialLink(network.key, e.target.value)} className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={network.placeholder} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal édition produit */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Modifier le produit</h3>
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit</label>
                <input type="text" value={editingProduct.name} onChange={(e) => updateProduct('name', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={editingProduct.descriptionShort || ''} onChange={(e) => updateProduct('descriptionShort', e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Description du produit..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix min (€)</label>
                  <input type="number" value={editingProduct.priceMin || ''} onChange={(e) => updateProduct('priceMin', e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix max (€)</label>
                  <input type="number" value={editingProduct.priceMax || ''} onChange={(e) => updateProduct('priceMax', e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL d'achat</label>
                <input type="url" value={editingProduct.externalBuyUrl || ''} onChange={(e) => updateProduct('externalBuyUrl', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select value={editingProduct.status} onChange={(e) => updateProduct('status', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="ACTIVE">Visible</option>
                  <option value="DRAFT">Masqué</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isFeatured" checked={editingProduct.isFeatured} onChange={(e) => updateProduct('isFeatured', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">Mettre en tendance (homepage)</label>
              </div>
              {editingProduct.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image actuelle</label>
                  <img src={editingProduct.imageUrl} alt="" className="w-32 h-32 object-cover rounded-lg" />
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleSaveProduct} disabled={savingProduct} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {savingProduct ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}