import Link from 'next/link';

import { ImageProduit } from './image-produit';

import { formatPriceRange } from '@/lib/utils';

/**
 * La carte produit, partagée entre le fil de l'accueil et le catalogue.
 * Une seule façon de montrer un produit sur tout le site (règle 8).
 */
export interface ProduitCarte {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brandName: string;
  brandSlug: string;
  sectorColor: string | null;
}

export function ProduitCard({ produit, priorite = false }: { produit: ProduitCarte; priorite?: boolean }) {
  const couleur = produit.sectorColor || '#0D2B4E';
  return (
    <Link
      href={`/produits/${produit.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {produit.imageUrl ? (
          <ImageProduit
            src={produit.imageUrl}
            alt={produit.name}
            priority={priorite}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: couleur }}>
            {produit.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 truncate">{produit.brandName}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-france-blue">{produit.name}</h3>
        {produit.priceMin != null && produit.priceMin > 0 && (
          <p className="text-sm font-semibold mt-1" style={{ color: couleur }}>{formatPriceRange(produit.priceMin, produit.priceMax)}</p>
        )}
      </div>
    </Link>
  );
}
