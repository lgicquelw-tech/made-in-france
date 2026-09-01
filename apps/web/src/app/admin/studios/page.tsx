'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, Crown, Star, ExternalLink, Eye, Settings, Image, Package, Users, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  tier: 'FREE' | 'PREMIUM' | 'ROYALE';
  status: string;
  productsCount: number;
  viewsCount: number;
  owner: { name: string; email: string } | null;
}

export default function StudiosPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'FREE' | 'PREMIUM' | 'ROYALE'>('all');

  useEffect(() => {
    loadBrands();
  }, [search, tierFilter]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands?search=${search}&tier=${tierFilter}`);
      if (res.ok) {
        const data = await res.json();
        setBrands(data.data);
      } else {
        setBrands([
          { id: 'b1', name: 'Le Slip Français', slug: 'le-slip-francais', logo: null, tier: 'ROYALE', status: 'VERIFIED', productsCount: 156, viewsCount: 12500, owner: { name: 'Guillaume Gibault', email: 'contact@leslipfrancais.fr' } },
          { id: 'b2', name: 'Saint James', slug: 'saint-james', logo: null, tier: 'ROYALE', status: 'VERIFIED', productsCount: 234, viewsCount: 9800, owner: { name: 'Marie Dupont', email: 'contact@saint-james.fr' } },
          { id: 'b3', name: 'Veja', slug: 'veja', logo: null, tier: 'PREMIUM', status: 'VERIFIED', productsCount: 89, viewsCount: 15600, owner: { name: 'Sébastien Kopp', email: 'contact@veja.fr' } },
          { id: 'b4', name: 'Armor Lux', slug: 'armor-lux', logo: null, tier: 'PREMIUM', status: 'VERIFIED', productsCount: 312, viewsCount: 7200, owner: { name: 'Jean Armor', email: 'contact@armorlux.fr' } },
          { id: 'b5', name: 'Opinel', slug: 'opinel', logo: null, tier: 'FREE', status: 'VERIFIED', productsCount: 45, viewsCount: 5400, owner: null },
          { id: 'b6', name: 'Marius Fabre', slug: 'marius-fabre', logo: null, tier: 'FREE', status: 'CLAIMED', productsCount: 28, viewsCount: 3200, owner: { name: 'Julie Fabre', email: 'julie@mariusfabre.fr' } },
        ]);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ROYALE': return { class: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white', icon: Crown };
      case 'PREMIUM': return { class: 'bg-gradient-to-r from-france-blue to-blue-600 text-white', icon: Star };
      default: return { class: 'bg-gray-100 text-gray-600', icon: Building2 };
    }
  };

  const filteredBrands = brands.filter(brand => {
    if (tierFilter !== 'all' && brand.tier !== tierFilter) return false;
    if (search && !brand.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MiF Studios</h1>
          <p className="text-gray-500 mt-1">Accéder au studio de n'importe quelle marque</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">902</div>
              <div className="text-sm text-gray-500">Total marques</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-500">Royale</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-france-blue/10 rounded-lg">
              <Star className="w-5 h-5 text-france-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">52</div>
              <div className="text-sm text-gray-500">Premium</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">127</div>
              <div className="text-sm text-gray-500">Avec propriétaire</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Rechercher une marque..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'ROYALE', 'PREMIUM', 'FREE'] as const).map((tier) => (
              <button key={tier} onClick={() => setTierFilter(tier)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tierFilter === tier ? 'bg-france-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {tier === 'all' ? 'Tous' : tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-france-blue"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Marque</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Propriétaire</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Produits</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vues</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBrands.map((brand) => {
                const tierInfo = getTierBadge(brand.tier);
                const TierIcon = tierInfo.icon;
                return (
                  <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          <div className="text-sm text-gray-500">/{brand.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${tierInfo.class}`}>
                        <TierIcon className="w-3 h-3" />
                        {brand.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {brand.owner ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{brand.owner.name}</div>
                          <div className="text-xs text-gray-500">{brand.owner.email}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Non revendiquée</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{brand.productsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{(brand.viewsCount || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/marques/${brand.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir la page">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                        <Link href={`/studio?brand=${brand.id}&admin=true`} className="p-2 hover:bg-france-blue/10 rounded-lg transition-colors" title="Accéder au Studio">
                          <Settings className="w-4 h-4 text-france-blue" />
                        </Link>
                        <Link href={`/studio/medias?brand=${brand.id}&admin=true`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Gérer les médias">
                          <Image className="w-4 h-4 text-gray-500" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}