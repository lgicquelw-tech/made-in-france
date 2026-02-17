'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  ShoppingBag,
  ExternalLink,
  X,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { useRef } from 'react';

const API_URL = 'http://localhost:4000';

interface Label {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
  brandsCount: number;
  productsCount: number;
}

interface LabelFormData {
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
}

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [formData, setFormData] = useState<LabelFormData>({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/labels`);
      const data = await res.json();
      setLabels(data.data || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingLabel ? prev.slug : generateSlug(name),
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Format non supporté. Utilisez PNG, SVG, JPG ou WebP.');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Le fichier est trop volumineux (max 2MB).');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch(`${API_URL}/api/upload?folder=labels`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, logoUrl: data.data.url }));
      } else {
        setFormError('Erreur lors de l\'upload du logo');
      }
    } catch (error) {
      setFormError('Erreur de connexion au serveur');
    } finally {
      setUploading(false);
      // Reset le input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const openCreateModal = () => {
    setEditingLabel(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
      websiteUrl: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (label: Label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      slug: label.slug,
      description: label.description || '',
      logoUrl: label.logoUrl || '',
      websiteUrl: label.websiteUrl || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const url = editingLabel
        ? `${API_URL}/api/admin/labels/${editingLabel.id}`
        : `${API_URL}/api/admin/labels`;

      const res = await fetch(url, {
        method: editingLabel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      await fetchLabels();
      setShowModal(false);
    } catch (error) {
      setFormError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/labels/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchLabels();
      }
    } catch (error) {
      console.error('Error deleting label:', error);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBrands = labels.reduce((acc, l) => acc + l.brandsCount, 0);
  const totalProducts = labels.reduce((acc, l) => acc + l.productsCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-france-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Labels & Certifications</h1>
          <p className="text-gray-500 mt-1">Gérez les labels disponibles pour les marques</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau label
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{labels.length}</div>
              <div className="text-sm text-gray-500">Total labels</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalBrands}</div>
              <div className="text-sm text-gray-500">Utilisations marques</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
              <div className="text-sm text-gray-500">Utilisations produits</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {labels.filter(l => l.logoUrl).length}
              </div>
              <div className="text-sm text-gray-500">Avec logo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Label</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Marques</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produits</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLabels.map((label) => (
              <tr key={label.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {label.logoUrl ? (
                        <img
                          src={label.logoUrl}
                          alt={label.name}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Award className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{label.name}</div>
                      {label.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{label.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {label.slug}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${label.brandsCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {label.brandsCount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${label.productsCount > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                    {label.productsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {label.websiteUrl && (
                      <a
                        href={label.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir le site"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(label)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    {deleteConfirm === label.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(label.id)}
                          disabled={deleting}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Confirmer"
                        >
                          {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(label.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLabels.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Aucun label trouvé' : 'Aucun label créé'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLabel ? 'Modifier le label' : 'Nouveau label'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du label *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                  placeholder="ex: Origine France Garantie"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none font-mono text-sm"
                  placeholder="ex: origine-france-garantie"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Identifiant unique (sans espaces ni caractères spéciaux)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none resize-none"
                  rows={3}
                  placeholder="Description du label..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo du label
                </label>

                {/* Toggle upload/URL */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      logoInputMode === 'upload'
                        ? 'bg-france-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Uploader
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      logoInputMode === 'url'
                        ? 'bg-france-blue text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    URL
                  </button>
                </div>

                {/* Prévisualisation du logo */}
                {formData.logoUrl && (
                  <div className="mb-3 relative inline-block">
                    <div className="w-20 h-20 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Erreur de chargement';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {logoInputMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.svg,.jpg,.jpeg,.webp,image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-france-blue hover:bg-france-blue/5 transition-colors ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 text-france-blue animate-spin" />
                          <span className="text-sm text-gray-600">Upload en cours...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Cliquez pour uploader (PNG, SVG, JPG, WebP - max 2MB)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                    placeholder="https://exemple.com/logo.png ou /labels/logo.png"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site web
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue outline-none"
                  placeholder="ex: https://www.originefrancegarantie.fr"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editingLabel ? 'Mettre à jour' : 'Créer le label'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
