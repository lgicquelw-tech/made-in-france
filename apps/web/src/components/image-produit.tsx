import Image from 'next/image';

import { imageOptimisable } from '@/lib/image-optimisable';

/**
 * Une image de produit ou de marque, quelle que soit sa provenance.
 *
 * `next/image` quand l'hôte est déclaré (Shopify, Cloudinary, wp.com : la grande
 * majorité), sinon un `<img>` paresseux. Sans ce choix, une seule image venue du domaine
 * d'une boutique WooCommerce faisait tomber la page (17 septembre 2026).
 */
interface Props { src: string; alt: string; sizes: string; className?: string; priority?: boolean }

export function ImageProduit({ src, alt, sizes, className, priority = false }: Props) {
  if (imageOptimisable(src)) {
    return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className={`absolute inset-0 w-full h-full ${className ?? ''}`} />;
}
