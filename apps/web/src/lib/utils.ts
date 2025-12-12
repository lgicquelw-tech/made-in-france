import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPriceRange(
  min?: number | null,
  max?: number | null,
  currency = 'EUR'
): string {
  if (min != null && max != null) {
    if (min === max) {
      return formatPrice(min, currency);
    }
    return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
  }
  if (min != null) {
    return `À partir de ${formatPrice(min, currency)}`;
  }
  if (max != null) {
    return `Jusqu'à ${formatPrice(max, currency)}`;
  }
  return 'Prix non communiqué';
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

export function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${path}`;
}
