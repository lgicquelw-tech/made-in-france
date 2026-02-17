'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Award,
  Check,
  Euro,
  ExternalLink,
  Package
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

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
  status: string;
  isFeatured: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Labels
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [productLabels, setProductLabels] = useState<Label[]>([]);
  const [togglingLabel, setTogglingLabel] = useState(false);

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      const [productRes, labelsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/products/${productId}`),
        fetch(`${API_URL}/api/v1/labels`),
      ]);

      if (productRes.ok) {
        const productData = await productRes.json();
        setProduct({
          ...productData.data,
          galleryUrls: productData.data.galleryUrls || [],
          materials: productData.data.materials || [],
          tags: productData.data.tags || [],
        });

        // Charger les labels du produit
        const productLabelsRes = await fetch(`${API_URL}/api/v1/products/${productId}/labels`);
        if (productLabelsRes.ok) {
          const productLabelsData = await productLabelsRes.json();
          setProductLabels(productLabelsData.data || []);
        }
      }

      if (labelsRes.ok) {
        const labelsData = await labelsRes.json();
        setAllLabels(labelsData.data || []);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setUploadingImage(true);
    const url = await uploadFile(file, 'products/images');
    if (url) {
      setProduct(prev => prev ? { ...prev, imageUrl: url } : null);
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !product) return;

    setUploadingGallery(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'products/gallery');
      if (url) newUrls.push(url);
    }

    setProduct(prev => prev ? {
      ...prev,
      galleryUrls: [...(prev.galleryUrls || []), ...newUrls],
    } : null);
    setUploadingGallery(false);
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    setProduct(prev => prev ? {
      ...prev,
      galleryUrls: (prev.galleryUrls || []).filter((_, i) => i !== index),
    } : null);
  };

  // Labels
  const toggleLabel = async (labelId: string) => {
    if (!product) return;
    const isActive = productLabels.some(l => l.id === labelId);
    setTogglingLabel(true);

    try {
      if (isActive) {
        const res = await fetch(`${API_URL}/api/admin/products/${product.id}/labels/${labelId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setProductLabels(prev => prev.filter(l => l.id !== labelId));
        }
      } else {
        const res = await fetch(`${API_URL}/api/admin/products/${product.id}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labelId }),
        });
        if (res.ok) {
          const label = allLabels.find(l => l.id === labelId);
          if (label) {
            setProductLabels(prev => [...prev, label]);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling label:', error);
    } finally {
      setTogglingLabel(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          descriptionShort: product.descriptionShort,
          descriptionLong: product.descriptionLong,
          imageUrl: product.imageUrl,
          galleryUrls: product.galleryUrls,
          priceMin: product.priceMin,
          priceMax: product.priceMax,
          externalBuyUrl: product.externalBuyUrl,
          manufacturingLocation: product.manufacturingLocation,
          materials: product.materials,
          tags: product.tags,
          status: product.status,
          isFeatured: product.isFeatured,
        }),
      });

      if (res.ok) {
        router.push('/admin/produits');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-france-blue animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Produit non trouvé</p>
        <Link href="/admin/produits" className="text-france-blue hover:underline mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/produits" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.brand && (
              <p className="text-gray-500 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {product.brand.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/produits/${product.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Voir
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de base */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Informations générales</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => setProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
              <input
                type="text"
                value={product.descriptionShort || ''}
                onChange={(e) => setProduct(prev => prev ? { ...prev, descriptionShort: e.target.value } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description longue</label>
              <textarea
                value={product.descriptionLong || ''}
                onChange={(e) => setProduct(prev => prev ? { ...prev, descriptionLong: e.target.value } : null)}
                rows={4}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix min (€)</label>
                <input
                  type="number"
                  value={product.priceMin || ''}
                  onChange={(e) => setProduct(prev => prev ? { ...prev, priceMin: e.target.value ? parseFloat(e.target.value) : null } : null)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix max (€)</label>
                <input
                  type="number"
                  value={product.priceMax || ''}
                  onChange={(e) => setProduct(prev => prev ? { ...prev, priceMax: e.target.value ? parseFloat(e.target.value) : null } : null)}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de fabrication</label>
              <input
                type="text"
                value={product.manufacturingLocation || ''}
                onChange={(e) => setProduct(prev => prev ? { ...prev, manufacturingLocation: e.target.value } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                placeholder="Paris, France"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lien d'achat</label>
              <input
                type="url"
                value={product.externalBuyUrl || ''}
                onChange={(e) => setProduct(prev => prev ? { ...prev, externalBuyUrl: e.target.value } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Images</h2>

            {/* Image principale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image principale</label>
              <div
                onClick={() => imageInputRef.current?.click()}
                className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-france-blue transition-colors overflow-hidden bg-gray-50"
              >
                {uploadingImage ? (
                  <Loader2 className="w-8 h-8 text-france-blue animate-spin" />
                ) : product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Cliquez pour uploader</span>
                  </div>
                )}
              </div>
            </div>

            {/* Galerie */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Galerie ({product.galleryUrls.length})
                </label>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingGallery}
                  className="text-france-blue text-sm hover:underline flex items-center gap-1"
                >
                  {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Ajouter
                </button>
              </div>
              {product.galleryUrls.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {product.galleryUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Aucune image dans la galerie</p>
              )}
            </div>
          </div>

          {/* Labels & Certifications */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Labels & Certifications ({productLabels.length}/{allLabels.length})
            </h2>

            {allLabels.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allLabels.map((label) => {
                  const isActive = productLabels.some(pl => pl.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      disabled={togglingLabel}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        isActive
                          ? 'bg-blue-50 border-blue-400 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      } ${togglingLabel ? 'opacity-50 cursor-wait' : ''}`}
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
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                Aucun label disponible. Créez-en dans Admin &gt; Labels.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Paramètres</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={product.status}
                onChange={(e) => setProduct(prev => prev ? { ...prev, status: e.target.value } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
              >
                <option value="ACTIVE">Actif</option>
                <option value="DRAFT">Brouillon</option>
                <option value="OUT_OF_STOCK">Rupture de stock</option>
                <option value="DISCONTINUED">Arrêté</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.isFeatured}
                onChange={(e) => setProduct(prev => prev ? { ...prev, isFeatured: e.target.checked } : null)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Produit mis en avant</span>
            </label>
          </div>

          {/* Tags & Matériaux */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Tags & Matériaux</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par virgules)</label>
              <input
                type="text"
                value={product.tags.join(', ')}
                onChange={(e) => setProduct(prev => prev ? {
                  ...prev,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                placeholder="bio, artisanal, luxe..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matériaux (séparés par virgules)</label>
              <input
                type="text"
                value={product.materials.join(', ')}
                onChange={(e) => setProduct(prev => prev ? {
                  ...prev,
                  materials: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                } : null)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                placeholder="coton, lin, cuir..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
