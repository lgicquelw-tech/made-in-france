/**
 * Generate a URL-friendly slug from a string
 */
declare function slugify(text: string): string;
/**
 * Format a price range for display
 */
declare function formatPriceRange(min?: number | null, max?: number | null, currency?: string): string;
/**
 * Format a price for display
 */
declare function formatPrice(price: number, currency?: string): string;
/**
 * Format a number for display
 */
declare function formatNumber(num: number): string;
/**
 * Format a date for display
 */
declare function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format a relative date (e.g., "il y a 2 jours")
 */
declare function formatRelativeDate(date: string | Date): string;
/**
 * Truncate text to a maximum length
 */
declare function truncate(text: string, maxLength: number): string;
/**
 * Capitalize the first letter of a string
 */
declare function capitalize(text: string): string;
/**
 * Calculate distance between two coordinates (in km)
 */
declare function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
/**
 * Format distance for display
 */
declare function formatDistance(km: number): string;
/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
declare function isEmpty(value: unknown): boolean;
/**
 * Generate a random ID
 */
declare function generateId(): string;
/**
 * Debounce a function
 */
declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle a function
 */
declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Deep clone an object
 */
declare function deepClone<T>(obj: T): T;
/**
 * Build a URL with query parameters
 */
declare function buildUrl(baseUrl: string, params: Record<string, string | number | boolean | string[] | undefined>): string;
/**
 * Parse query parameters from a URL
 */
declare function parseQueryParams(url: string): Record<string, string | string[]>;

export { buildUrl, calculateDistance, capitalize, debounce, deepClone, formatDate, formatDistance, formatNumber, formatPrice, formatPriceRange, formatRelativeDate, generateId, isEmpty, parseQueryParams, slugify, throttle, truncate };
