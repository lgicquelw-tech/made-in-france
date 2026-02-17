'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    MapPin,
    Phone,
    Mail,
    Calendar,
    Plus,
    X,
    Upload,
    ExternalLink,
    Pencil,
    Check,
    Package,
    Trash2,
    Euro,
    ShoppingBag,
    Image as ImageIcon,
    Loader2,
    BookOpen,
    EyeOff,
    Award // Ajouté car utilisé dans le code original
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichEditor } from '@/components/ui/rich-editor';
import { IconPicker, AVAILABLE_ICONS, IconName, getIconComponent } from '@/components/ui/icon-picker';

const API_URL = 'http://localhost:4000';

// --- INTERFACES ---

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
    descriptionLong: string | null;
    story: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    galleryUrls: string[];
    videoUrl: string | null;
    websiteUrl: string | null;
    city: string | null;
    address: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
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
    sectorId: string | null;
    regionId: string | null;
    sector: { id: string; name: string; color: string } | null;
    region: { id: string; name: string } | null;
    status: string;
    isFeatured: boolean;
    isVerified: boolean;
    // Ajout pour typage strict
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
    descriptionLong: string | null;
    imageUrl: string | null;
    galleryUrls: string[];
    priceMin: number | null;
    priceMax: number | null;
    currency: string;
    externalBuyUrl: string | null;
    manufacturingLocation: string | null;
    materials: string[];
    tags: string[];
    attributes: {
        target?: string;
        priceRange?: string;
        benefits?: string[];
        usage?: string[];
        [key: string]: any;
    };
    aiSellingPoints: string[];
    status: string;
    isFeatured: boolean;
    brandId?: string; // Ajouté pour la cohérence
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

interface Label {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
}

const SOCIAL_NETWORKS = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/...' },
    { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/...' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...' },
    { key: 'tiktok', label: 'TikTok', icon: Globe, placeholder: 'https://tiktok.com/@...' },
];

// Fonction utilitaire pour le logo
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

export default function EditBrandPage() {
    const params = useParams();
    const router = useRouter();
    const isNew = params.id === 'new';

    // Refs pour les inputs fichiers
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const productImageInputRef = useRef<HTMLInputElement>(null);
    const productGalleryInputRef = useRef<HTMLInputElement>(null);

    // États
    const [brand, setBrand] = useState<Partial<Brand>>({
        name: '',
        descriptionShort: '',
        descriptionLong: '',
        story: '',
        websiteUrl: '',
        city: '',
        address: '',
        postalCode: '',
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
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Modales
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [savingProduct, setSavingProduct] = useState(false);

    // Upload states
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [uploadingProductImage, setUploadingProductImage] = useState(false);
    const [uploadingProductGallery, setUploadingProductGallery] = useState(false);

    // Contenu riche & Tags
    const [sections, setSections] = useState<ContentSection[]>([]);
    const [brandTags, setBrandTags] = useState<string[]>([]);

    // Labels
    const [allLabels, setAllLabels] = useState<Label[]>([]);
    const [brandLabels, setBrandLabels] = useState<Label[]>([]);
    const [addingLabel, setAddingLabel] = useState(false);

    // --- CORRECTION : AJOUT DE LA FONCTION UPDATEFIELD ---
    const updateField = (field: keyof Brand, value: any) => {
        setBrand(prev => ({
            ...prev,
            [field]: value
        }));
    };
    // -----------------------------------------------------

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            const [sectorsRes, regionsRes, labelsRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/sectors`),
                fetch(`${API_URL}/api/v1/regions`),
                fetch(`${API_URL}/api/v1/labels`),
            ]);

            const sectorsData = await sectorsRes.json();
            const regionsData = await regionsRes.json();
            const labelsData = await labelsRes.json();

            setSectors(sectorsData.data);
            setRegions(regionsData.data);
            setAllLabels(labelsData.data || []);

            if (!isNew) {
                const brandRes = await fetch(`${API_URL}/api/admin/brands/${params.id}`);
                const brandData = await brandRes.json();
                setBrand({
                    ...brandData.data,
                    galleryUrls: brandData.data.galleryUrls || [],
                });

                // Charger les sections depuis aiGeneratedContent
                const aiContent = brandData.data.aiGeneratedContent || {};
                if (aiContent.sections && aiContent.sections.length > 0) {
                    setSections(aiContent.sections.map((s: any) => ({
                        ...s,
                        visible: s.visible !== undefined ? s.visible : true,
                    })));
                } else {
                    // Migrer les anciens champs story/descriptionLong vers des sections
                    const initialSections: ContentSection[] = [];
                    if (brandData.data.story) {
                        initialSections.push({
                            id: crypto.randomUUID(),
                            title: "L'histoire",
                            icon: 'BookOpen',
                            content: brandData.data.story,
                            visible: true,
                        });
                    }
                    if (brandData.data.descriptionLong) {
                        initialSections.push({
                            id: crypto.randomUUID(),
                            title: "Description détaillée",
                            icon: 'Award',
                            content: brandData.data.descriptionLong,
                            visible: true,
                        });
                    }
                    setSections(initialSections);
                }

                // Charger les tags
                setBrandTags(aiContent.tags || []);

                // Charger les labels de la marque
                const brandLabelsRes = await fetch(`${API_URL}/api/admin/brands/${params.id}/labels`);
                const brandLabelsData = await brandLabelsRes.json();
                setBrandLabels(brandLabelsData.data || []);

                const productsRes = await fetch(`${API_URL}/api/admin/brands/${params.id}/products`);
                const productsData = await productsRes.json();
                setProducts(productsData.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
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

    // --- Gestion Uploads Marque ---

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const url = await uploadFile(file, 'brands/logos');
        if (url) {
            setBrand(prev => ({ ...prev, logoUrl: url }));
        }
        setUploadingLogo(false);
        e.target.value = '';
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        const url = await uploadFile(file, 'brands/covers');
        if (url) {
            setBrand(prev => ({ ...prev, coverImageUrl: url }));
        }
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

    // --- Gestion Uploads Produits ---

    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingProduct) return;

        setUploadingProductImage(true);
        const url = await uploadFile(file, 'products/images');
        if (url) {
            setEditingProduct(prev => prev ? { ...prev, imageUrl: url } : null);
        }
        setUploadingProductImage(false);
        e.target.value = '';
    };

    const handleProductGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !editingProduct) return;

        setUploadingProductGallery(true);
        const newUrls: string[] = [];

        for (const file of Array.from(files)) {
            const url = await uploadFile(file, 'products/gallery');
            if (url) newUrls.push(url);
        }

        setEditingProduct(prev => prev ? {
            ...prev,
            galleryUrls: [...(prev.galleryUrls || []), ...newUrls],
        } : null);
        setUploadingProductGallery(false);
        e.target.value = '';
    };

    const removeProductGalleryImage = (index: number) => {
        setEditingProduct(prev => prev ? {
            ...prev,
            galleryUrls: (prev.galleryUrls || []).filter((_, i) => i !== index),
        } : null);
    };

    // --- Sauvegarde ---

    const handleSave = async () => {
        setSaving(true);
        try {
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew
                ? `${API_URL}/api/admin/brands`
                : `${API_URL}/api/admin/brands/${params.id}`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...brand,
                    aiGeneratedContent: {
                        ...((brand as any).aiGeneratedContent || {}),
                        sections: sections,
                        tags: brandTags,
                    },
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (isNew) {
                    router.push(`/admin/marques/${data.data.id}`);
                }
                alert('Marque enregistrée avec succès !');
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

    // --- Gestion des Labels ---

    const addLabelToBrand = async (labelId: string) => {
        if (!brand.id) return;
        setAddingLabel(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/labels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ labelId }),
            });
            if (res.ok) {
                const label = allLabels.find(l => l.id === labelId);
                if (label) {
                    setBrandLabels(prev => [...prev, label]);
                }
            } else {
                const data = await res.json();
                console.error('Error adding label:', data.error);
            }
        } catch (error) {
            console.error('Error adding label:', error);
        } finally {
            setAddingLabel(false);
        }
    };

    const removeLabelFromBrand = async (labelId: string) => {
        if (!brand.id) return;
        setAddingLabel(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/labels/${labelId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setBrandLabels(prev => prev.filter(l => l.id !== labelId));
            } else {
                const data = await res.json();
                console.error('Error removing label:', data.error);
            }
        } catch (error) {
            console.error('Error removing label:', error);
        } finally {
            setAddingLabel(false);
        }
    };

    // --- Gestion des Sections ---

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
        setSections(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const toggleSectionVisibility = (id: string) => {
        setSections(prev => prev.map(s =>
            s.id === id ? { ...s, visible: !s.visible } : s
        ));
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

    // --- Gestion Réseaux Sociaux ---

    const updateSocialLink = (key: string, value: string) => {
        setBrand(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [key]: value,
            },
        }));
    };

    const removeSocialLink = (key: string) => {
        setBrand(prev => {
            const newLinks = { ...prev.socialLinks };
            delete newLinks[key as keyof typeof newLinks];
            return { ...prev, socialLinks: newLinks };
        });
    };

    // --- Gestion Produits ---

    const handleSaveProduct = async () => {
        if (!editingProduct?.name) return;
        setSavingProduct(true);

        try {
            const method = editingProduct.id ? 'PUT' : 'POST';
            const url = editingProduct.id
                ? `${API_URL}/api/admin/products/${editingProduct.id}`
                : `${API_URL}/api/admin/products`;

            const productData = {
                ...editingProduct,
                brandId: params.id,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (res.ok) {
                setShowProductModal(false);
                setEditingProduct(null);
                const productsRes = await fetch(`${API_URL}/api/admin/brands/${params.id}/products`);
                const productsData = await productsRes.json();
                setProducts(productsData.data || []);
            } else {
                alert('Erreur lors de l\'enregistrement du produit');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erreur lors de l\'enregistrement du produit');
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Supprimer ce produit ?')) return;

        try {
            await fetch(`${API_URL}/api/admin/products/${productId}`, { method: 'DELETE' });
            setProducts(products.filter(p => p.id !== productId));
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-france-blue"></div>
            </div>
        );
    }

    const activeSocialLinks = Object.entries(brand.socialLinks || {}).filter(([_, v]) => v !== undefined);
    const logoUrl = getLogoUrl(brand);
    const isUploadedLogo = brand.logoUrl?.includes('cloudinary.com');

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Inputs cachés pour l'upload */}
            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
            <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />
            <input type="file" ref={productImageInputRef} onChange={handleProductImageUpload} accept="image/*" className="hidden" />
            <input type="file" ref={productGalleryInputRef} onChange={handleProductGalleryUpload} accept="image/*" multiple className="hidden" />

            {/* Header Fixe */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900">
                                {isNew ? 'Nouvelle marque' : `Modifier : ${brand.name}`}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {isNew ? 'Créer une nouvelle fiche marque' : `/${brand.slug}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isNew && (
                            <Link href={`/marques/${brand.slug}`} target="_blank">
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Prévisualiser
                                </Button>
                            </Link>
                        )}
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-20 pb-12">
                <div className="max-w-5xl mx-auto px-6">

                    {/* Bloc Principal : Couverture & Info */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">

                        {/* Couverture */}
                        <div
                            className="h-64 relative bg-gradient-to-br from-france-blue to-blue-700"
                            style={brand.coverImageUrl ? {
                                backgroundImage: `url(${brand.coverImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {}}
                        >
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                disabled={uploadingCover}
                                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg transition-all"
                            >
                                {uploadingCover ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                <span className="text-sm font-medium">
                                    {uploadingCover ? 'Upload...' : 'Changer la couverture'}
                                </span>
                            </button>

                            {brand.coverImageUrl && (
                                <button
                                    onClick={() => updateField('coverImageUrl', null)}
                                    className="absolute top-4 right-52 bg-red-500/90 hover:bg-red-500 text-white rounded-xl px-3 py-2 shadow-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            {/* Logo */}
                            <div className="absolute -bottom-16 left-8">
                                <div className="relative">
                                    <div className="w-28 h-28 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white p-2">
                                        {logoUrl ? (
                                            <img
                                                src={logoUrl}
                                                alt="Logo"
                                                className={isUploadedLogo ? "w-full h-full object-contain" : "w-16 h-16 object-contain"}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-france-blue">
                                                {brand.name?.charAt(0) || '?'}
                                            </span>
                                        )}
                                    </div>

                                    {(logoUrl || brand.websiteUrl) && (
                                        <div className={`absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${isUploadedLogo ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {isUploadedLogo ? 'Uploadé' : 'Auto'}
                                        </div>
                                    )}

                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                            className="bg-france-blue hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all"
                                            title="Uploader un logo"
                                        >
                                            {uploadingLogo ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Upload className="w-3 h-3" />
                                            )}
                                        </button>

                                        {brand.logoUrl && (
                                            <button
                                                onClick={() => updateField('logoUrl', null)}
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all"
                                                title="Supprimer le logo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Formulaire Principal */}
                        <div className="pt-20 px-8 pb-8">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                                {/* Colonne Gauche */}
                                <div className="flex-1 space-y-6">

                                    {/* Nom */}
                                    <div
                                        className="group cursor-pointer"
                                        onClick={() => setActiveSection('name')}
                                    >
                                        {activeSection === 'name' ? (
                                            <input
                                                type="text"
                                                value={brand.name || ''}
                                                onChange={(e) => updateField('name', e.target.value)}
                                                onBlur={() => setActiveSection(null)}
                                                autoFocus
                                                className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-france-blue outline-none w-full"
                                                placeholder="Nom de la marque"
                                            />
                                        ) : (
                                            <h1 className="text-3xl font-bold text-gray-900 group-hover:text-france-blue transition-colors flex items-center gap-2">
                                                {brand.name || 'Nom de la marque'}
                                                <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                                            </h1>
                                        )}
                                    </div>

                                    {/* Secteur & Région */}
                                    <div className="flex flex-wrap gap-3">
                                        <select
                                            value={brand.sectorId || ''}
                                            onChange={(e) => updateField('sectorId', e.target.value || null)}
                                            className="px-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
                                        >
                                            <option value="">Choisir un secteur</option>
                                            {sectors.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={brand.regionId || ''}
                                            onChange={(e) => updateField('regionId', e.target.value || null)}
                                            className="px-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
                                        >
                                            <option value="">Choisir une région</option>
                                            {regions.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description Courte */}
                                    <div
                                        className="group cursor-pointer"
                                        onClick={() => setActiveSection('descriptionShort')}
                                    >
                                        {activeSection === 'descriptionShort' ? (
                                            <textarea
                                                value={brand.descriptionShort || ''}
                                                onChange={(e) => updateField('descriptionShort', e.target.value)}
                                                onBlur={() => setActiveSection(null)}
                                                autoFocus
                                                rows={3}
                                                className="w-full text-gray-600 bg-transparent border rounded-xl p-3 outline-none focus:border-france-blue"
                                                placeholder="Description courte de la marque..."
                                            />
                                        ) : (
                                            <p className="text-gray-600 group-hover:bg-gray-50 rounded-xl p-3 -m-3 transition-colors">
                                                {brand.descriptionShort || 'Cliquez pour ajouter une description courte...'}
                                                <Pencil className="w-3 h-3 inline ml-2 opacity-0 group-hover:opacity-50" />
                                            </p>
                                        )}
                                    </div>

                                    {/* Localisation */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Localisation
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={brand.address || ''}
                                                onChange={(e) => updateField('address', e.target.value)}
                                                placeholder="Adresse"
                                                className="px-4 py-2 border rounded-xl text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={brand.postalCode || ''}
                                                onChange={(e) => updateField('postalCode', e.target.value)}
                                                placeholder="Code postal"
                                                className="px-4 py-2 border rounded-xl text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={brand.city || ''}
                                                onChange={(e) => updateField('city', e.target.value)}
                                                placeholder="Ville"
                                                className="px-4 py-2 border rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Contact
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={brand.email || ''}
                                                    onChange={(e) => updateField('email', e.target.value)}
                                                    placeholder="Email"
                                                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={brand.phone || ''}
                                                    onChange={(e) => updateField('phone', e.target.value)}
                                                    placeholder="Téléphone"
                                                    className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sections de contenu */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Sections de contenu</h3>
                                            <button
                                                onClick={addSection}
                                                className="text-france-blue hover:bg-france-blue/10 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Ajouter une section
                                            </button>
                                        </div>

                                        {sections.length === 0 ? (
                                            <div
                                                onClick={addSection}
                                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-france-blue transition-colors"
                                            >
                                                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Cliquez pour ajouter une section</p>
                                                <p className="text-xs text-gray-400 mt-1">Ex: L'histoire, Notre savoir-faire, Nos engagements...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {sections.map((section, index) => {
                                                    const IconComponent = getIconComponent(section.icon);
                                                    return (
                                                        <div key={section.id} className="border rounded-xl overflow-hidden">
                                                            <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                                                                <IconPicker
                                                                    value={section.icon}
                                                                    onChange={(icon) => updateSection(section.id, 'icon', icon)}
                                                                    color={brand.sector?.color || '#002395'}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={section.title}
                                                                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                                                                    className="flex-1 px-3 py-2 border rounded-lg text-sm font-medium"
                                                                    placeholder="Titre de la section"
                                                                />
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => toggleSectionVisibility(section.id)}
                                                                        className={`p-1.5 rounded hover:bg-gray-200 ${section.visible ? 'text-green-500' : 'text-gray-400'}`}
                                                                        title={section.visible ? 'Masquer' : 'Afficher'}
                                                                    >
                                                                        {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveSectionUp(index)}
                                                                        disabled={index === 0}
                                                                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        title="Monter"
                                                                    >
                                                                        <ArrowLeft className="w-4 h-4 rotate-90" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveSectionDown(index)}
                                                                        disabled={index === sections.length - 1}
                                                                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                        title="Descendre"
                                                                    >
                                                                        <ArrowLeft className="w-4 h-4 -rotate-90" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => removeSection(section.id)}
                                                                        className="p-1.5 rounded hover:bg-red-100 text-red-500"
                                                                        title="Supprimer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <RichEditor
                                                                    content={section.content}
                                                                    onChange={(content) => updateSection(section.id, 'content', content)}
                                                                    placeholder="Contenu de la section..."
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Galerie Photos */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                Galerie photos ({(brand.galleryUrls || []).length})
                                            </h3>
                                            <button
                                                onClick={() => galleryInputRef.current?.click()}
                                                disabled={uploadingGallery}
                                                className="text-france-blue hover:bg-france-blue/10 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                                            >
                                                {uploadingGallery ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Plus className="w-4 h-4" />
                                                )}
                                                Ajouter des photos
                                            </button>
                                        </div>

                                        {(brand.galleryUrls || []).length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {(brand.galleryUrls || []).map((url, index) => (
                                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                                                        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => removeGalleryImage(index)}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-france-blue transition-colors"
                                            >
                                                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Cliquez pour ajouter des photos</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Labels & Certifications */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Labels & Certifications ({brandLabels.length}/{allLabels.length})
                                            </h3>
                                        </div>

                                        {/* Grille de tous les labels avec toggle */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {allLabels.map((label) => {
                                                const isActive = brandLabels.some(bl => bl.id === label.id);
                                                return (
                                                    <button
                                                        key={label.id}
                                                        onClick={() => isActive ? removeLabelFromBrand(label.id) : addLabelToBrand(label.id)}
                                                        disabled={addingLabel}
                                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                                                            isActive
                                                                ? 'bg-blue-50 border-blue-400 shadow-sm'
                                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                                                        } ${addingLabel ? 'opacity-50 cursor-wait' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                            isActive ? 'bg-blue-100' : 'bg-white'
                                                        }`}>
                                                            {label.logoUrl ? (
                                                                <img src={label.logoUrl} alt={label.name} className="w-6 h-6 object-contain" />
                                                            ) : (
                                                                <Award className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`text-xs font-medium truncate ${
                                                                isActive ? 'text-blue-800' : 'text-gray-700'
                                                            }`}>
                                                                {label.name}
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {allLabels.length === 0 && (
                                            <p className="text-sm text-gray-500 italic text-center py-4">
                                                Aucun label disponible. Créez-en dans Admin &gt; Labels.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Colonne Droite (Sidebar) */}
                                <div className="lg:w-80 space-y-6">

                                    {/* Site web */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            Site web
                                        </h3>
                                        <input
                                            type="url"
                                            value={brand.websiteUrl || ''}
                                            onChange={(e) => updateField('websiteUrl', e.target.value)}
                                            placeholder="https://www.exemple.fr"
                                            className="w-full px-4 py-2 border rounded-xl text-sm"
                                        />
                                        {/* CORRECTION : Balise <a> correctement formée */}
                                        {brand.websiteUrl && (
                                            <a
                                                href={brand.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-france-blue hover:underline flex items-center gap-1"
                                            >
                                                Visiter le site <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Tags IA */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            🤖 Tags pour l'IA
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Ces tags aident l'IA à mieux trouver cette marque (non visibles sur la page publique)
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {brandTags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => setBrandTags(prev => prev.filter((_, i) => i !== index))}
                                                        className="hover:text-purple-900"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Ajouter un tag et appuyer Entrée..."
                                            className="w-full px-3 py-2 border rounded-lg text-sm"
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

                                    {/* Réseaux Sociaux */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Réseaux sociaux</h3>
                                            <button
                                                onClick={() => setShowSocialModal(true)}
                                                className="text-france-blue hover:bg-france-blue/10 p-1 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {activeSocialLinks.length > 0 ? (
                                            <div className="space-y-2">
                                                {activeSocialLinks.map(([key, value]) => {
                                                    const network = SOCIAL_NETWORKS.find(n => n.key === key);
                                                    if (!network) return null;
                                                    const Icon = network.icon;
                                                    return (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                            <input
                                                                type="url"
                                                                value={value as string}
                                                                onChange={(e) => updateSocialLink(key, e.target.value)}
                                                                placeholder={network.placeholder}
                                                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm min-w-0"
                                                            />
                                                            <button
                                                                onClick={() => removeSocialLink(key)}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded flex-shrink-0"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">Aucun réseau social configuré</p>
                                        )}
                                    </div>

                                    {/* Année */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Année de fondation
                                        </h3>
                                        <input
                                            type="number"
                                            value={brand.yearFounded || ''}
                                            onChange={(e) => updateField('yearFounded', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="Ex: 1985"
                                            min="1800"
                                            max={new Date().getFullYear()}
                                            className="w-full px-4 py-2 border rounded-xl text-sm"
                                        />
                                    </div>

                                    {/* Vidéo */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-gray-900">Vidéo</h3>
                                        <input
                                            type="url"
                                            value={brand.videoUrl || ''}
                                            onChange={(e) => updateField('videoUrl', e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full px-4 py-2 border rounded-xl text-sm"
                                        />
                                    </div>

                                    {/* Options */}
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-gray-900">Options</h3>

                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Statut</label>
                                            <select
                                                value={brand.status || 'ACTIVE'}
                                                onChange={(e) => updateField('status', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-xl text-sm"
                                            >
                                                <option value="ACTIVE">Actif</option>
                                                <option value="PENDING">En attente</option>
                                                <option value="INACTIVE">Inactif</option>
                                            </select>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={brand.isFeatured || false}
                                                onChange={(e) => updateField('isFeatured', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-gray-700">Marque mise en avant</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={brand.isVerified || false}
                                                onChange={(e) => updateField('isVerified', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-gray-700">Marque vérifiée ✓</span>
                                        </label>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liste des Produits */}
                    {!isNew && (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-france-blue" />
                                    <h2 className="text-lg font-semibold text-gray-900">Produits ({products.length})</h2>
                                </div>
                                <Button onClick={() => { setEditingProduct({ galleryUrls: [], materials: [] }); setShowProductModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter un produit
                                </Button>
                            </div>

                            {products.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                    {products.map(product => (
                                        <div key={product.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                            <div
                                                className="h-40 bg-gray-100 flex items-center justify-center"
                                                style={product.imageUrl ? {
                                                    backgroundImage: `url(${product.imageUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                } : {}}
                                            >
                                                {!product.imageUrl && <Package className="w-12 h-12 text-gray-300" />}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-medium text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                    {product.descriptionShort || 'Pas de description'}
                                                </p>
                                                {(product.priceMin || product.priceMax) && (
                                                    <div className="flex items-center gap-1 mt-2 text-france-blue font-medium">
                                                        <Euro className="w-4 h-4" />
                                                        {product.priceMin && product.priceMax
                                                            ? `${product.priceMin} - ${product.priceMax} €`
                                                            : `${product.priceMin || product.priceMax} €`
                                                        }
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {product.status === 'ACTIVE' ? 'Actif' : product.status}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setEditingProduct({ ...product, galleryUrls: product.galleryUrls || [], materials: product.materials || [] }); setShowProductModal(true); }}
                                                            className="text-gray-500 hover:text-france-blue"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="text-gray-500 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="font-medium text-gray-900 mb-1">Aucun produit</h3>
                                    <p className="text-sm text-gray-500 mb-4">Ajoutez des produits pour les afficher sur la fiche marque</p>
                                    <Button variant="outline" onClick={() => { setEditingProduct({ galleryUrls: [], materials: [] }); setShowProductModal(true); }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Ajouter un produit
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>

            {/* Modal Réseaux Sociaux */}
            {showSocialModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Ajouter un réseau social</h3>
                            <button onClick={() => setShowSocialModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-2">
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
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'hover:bg-gray-50'
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

            {/* Modal Produit */}
            {showProductModal && editingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold">
                                {editingProduct?.id ? 'Modifier le produit' : 'Nouveau produit'}
                            </h3>
                            <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Image principale</label>
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                        style={editingProduct?.imageUrl ? {
                                            backgroundImage: `url(${editingProduct.imageUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        } : {}}
                                    >
                                        {!editingProduct?.imageUrl && <ImageIcon className="w-8 h-8 text-gray-300" />}
                                    </div>
                                    <div className="flex-1">
                                        <button
                                            onClick={() => productImageInputRef.current?.click()}
                                            disabled={uploadingProductImage}
                                            className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            {uploadingProductImage ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4" />
                                            )}
                                            {uploadingProductImage ? 'Upload...' : 'Choisir une image'}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">ou coller une URL :</p>
                                        <input
                                            type="url"
                                            value={editingProduct?.imageUrl || ''}
                                            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                                            className="w-full px-3 py-2 border rounded-xl text-sm mt-1"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Galerie photos ({(editingProduct?.galleryUrls || []).length})
                                    </label>
                                    <button
                                        onClick={() => productGalleryInputRef.current?.click()}
                                        disabled={uploadingProductGallery}
                                        className="text-france-blue hover:bg-france-blue/10 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                                    >
                                        {uploadingProductGallery ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        Ajouter
                                    </button>
                                </div>
                                {(editingProduct?.galleryUrls || []).length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {(editingProduct?.galleryUrls || []).map((url, index) => (
                                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeProductGalleryImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                                    <input
                                        type="text"
                                        value={editingProduct?.name || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="Ex: Chemise en lin"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
                                    <textarea
                                        value={editingProduct?.descriptionShort || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, descriptionShort: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        rows={2}
                                        placeholder="Brève description du produit..."
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée</label>
                                    <textarea
                                        value={editingProduct?.descriptionLong || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, descriptionLong: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        rows={4}
                                        placeholder="Description complète, matériaux, fabrication..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix min (€)</label>
                                    <input
                                        type="number"
                                        value={editingProduct?.priceMin || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, priceMin: e.target.value ? parseFloat(e.target.value) : null } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="29"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix max (€)</label>
                                    <input
                                        type="number"
                                        value={editingProduct?.priceMax || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, priceMax: e.target.value ? parseFloat(e.target.value) : null } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="59"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lien d'achat</label>
                                    <input
                                        type="url"
                                        value={editingProduct?.externalBuyUrl || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, externalBuyUrl: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="https://www.boutique.fr/produit"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de fabrication</label>
                                    <input
                                        type="text"
                                        value={editingProduct?.manufacturingLocation || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, manufacturingLocation: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="Ex: Lyon, France"
                                    />
                                </div>

                                {/* === CHAMPS IA === */}
                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-lg">🤖</span> Données pour l'IA
                                    </h4>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags (séparés par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        value={(editingProduct?.tags || []).join(', ')}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="proteine, barres, musculation, recuperation..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Ex: proteine, whey, musculation, vegan, bio, premium...</p>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ingrédients / Matériaux (séparés par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        value={(editingProduct?.materials || []).join(', ')}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            materials: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="whey, collagène, vitamine C..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cible</label>
                                    <select
                                        value={(editingProduct?.attributes as any)?.target || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            attributes: { ...(prev.attributes || {}), target: e.target.value }
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="homme">Homme</option>
                                        <option value="femme">Femme</option>
                                        <option value="mixte">Mixte</option>
                                        <option value="enfant">Enfant</option>
                                        <option value="sportif">Sportif</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gamme de prix</label>
                                    <select
                                        value={(editingProduct?.attributes as any)?.priceRange || ''}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            attributes: { ...(prev.attributes || {}), priceRange: e.target.value }
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="budget">Budget (&lt;30€)</option>
                                        <option value="moyen">Moyen (30-60€)</option>
                                        <option value="premium">Premium (60-100€)</option>
                                        <option value="luxe">Luxe (&gt;100€)</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bénéfices (séparés par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        value={((editingProduct?.attributes as any)?.benefits || []).join(', ')}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            attributes: {
                                                ...(prev.attributes || {}),
                                                benefits: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t)
                                            }
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="Récupération musculaire, Énergie, Prise de masse..."
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Moments d'utilisation (séparés par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        value={((editingProduct?.attributes as any)?.usage || []).join(', ')}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            attributes: {
                                                ...(prev.attributes || {}),
                                                usage: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t)
                                            }
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="pre-entrainement, post-entrainement, quotidien..."
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Arguments de vente (séparés par des virgules)
                                    </label>
                                    <input
                                        type="text"
                                        value={(editingProduct?.aiSellingPoints || []).join(', ')}
                                        onChange={(e) => setEditingProduct(prev => prev ? {
                                            ...prev,
                                            aiSellingPoints: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                                        } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                        placeholder="100% Made in France, Sans additifs, Certifié bio..."
                                    />
                                </div>
                                {/* === FIN CHAMPS IA === */}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                                    <select
                                        value={editingProduct?.status || 'ACTIVE'}
                                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, status: e.target.value } : null)}
                                        className="w-full px-4 py-2 border rounded-xl"
                                    >
                                        <option value="ACTIVE">Actif</option>
                                        <option value="DRAFT">Brouillon</option>
                                        <option value="OUT_OF_STOCK">Rupture de stock</option>
                                        <option value="DISCONTINUED">Arrêté</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingProduct?.isFeatured || false}
                                            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, isFeatured: e.target.checked } : null)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">Produit mis en avant</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                            <Button variant="outline" onClick={() => { setShowProductModal(false); setEditingProduct(null); }}>
                                Annuler
                            </Button>
                            <Button onClick={handleSaveProduct} disabled={savingProduct}>
                                <Save className="w-4 h-4 mr-2" />
                                {savingProduct ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}