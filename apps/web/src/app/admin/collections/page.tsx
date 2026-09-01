'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderOpen, Plus, Eye, Edit, Trash2, Star, Clock, CheckCircle, Image, Package, GripVertical } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  brandsCount: number;
  productsCount: number;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  createdAt: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([
    { id: '1', name: 'Mode Éthique', slug: 'mode-ethique', description: 'Les marques de mode responsable', image: null, brandsCount: 45, productsCount: 890, status: 'PUBLISHED', featured: true, createdAt: '2024-01-10' },
    { id: '2', name: 'Beauté Naturelle', slug: 'beaute-naturelle', description: 'Cosmétiques bio et naturels', image: null, brandsCount: 32, productsCount: 456, status: 'PUBLISHED', featured: true, createdAt: '2024-01-08' },
    { id: '3', name: 'Maison & Déco', slug: 'maison-deco', description: 'Artisanat et décoration française', image: null, brandsCount: 28, productsCount: 312, status: 'PUBLISHED', featured: false, createdAt: '2024-01-05' },
    { id: '4', name: 'Idées Cadeaux', slug: 'idees-cadeaux', description: 'Sélection de cadeaux made in France', image: null, brandsCount: 56, productsCount: 234, status: 'PUBLISHED', featured: true, createdAt: '2024-01-02' },
    { id: '5', name: 'Sport & Outdoor', slug: 'sport-outdoor', description: 'Équipements sportifs français', image: null, brandsCount: 18, productsCount: 145, status: 'DRAFT', featured: false, createdAt: '2024-01-15' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">Gérez vos collections de marques et produits</p>
        </div>
        <Link href="/admin/collections/new" className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors">
          <Plus className="w-4 h-4" />
          Nouvelle collection
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FolderOpen className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{collections.length}</div>
              <div className="text-sm text-gray-500">Total collections</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{collections.filter(c => c.status === 'PUBLISHED').length}</div>
              <div className="text-sm text-gray-500">Publiées</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Star className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{collections.filter(c => c.featured).length}</div>
              <div className="text-sm text-gray-500">En vedette</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Package className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{collections.reduce((acc, c) => acc + c.productsCount, 0).toLocaleString()}</div>
              <div className="text-sm text-gray-500">Produits total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Collection</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Marques</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produits</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {collections.map((collection) => (
              <tr key={collection.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      {collection.image ? (
                        <img src={collection.image} alt={collection.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {collection.name}
                        {collection.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="text-sm text-gray-500">{collection.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{collection.brandsCount}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{collection.productsCount}</td>
                <td className="px-6 py-4">
                  {collection.status === 'PUBLISHED' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      Publiée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <Clock className="w-3 h-3" />
                      Brouillon
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/collections/${collection.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Link>
                    <Link href={`/admin/collections/${collection.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Modifier">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Link>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
