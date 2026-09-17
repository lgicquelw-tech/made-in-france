import { describe, expect, test } from 'vitest';
import { imageOptimisable } from './image-optimisable';

describe('imageOptimisable', () => {
  test('les hotes declares passent', () => {
    expect(imageOptimisable('https://cdn.shopify.com/s/files/1/x.jpg')).toBe(true);
    expect(imageOptimisable('https://i0.wp.com/site/x.jpg')).toBe(true);
    expect(imageOptimisable('https://res.cloudinary.com/mif/x.jpg')).toBe(true);
  });
  test('une boutique WooCommerce sur son propre domaine : non — <img>, pas de crash', () => {
    expect(imageOptimisable('https://letresseur.com/wp-content/uploads/x.jpg')).toBe(false);
    expect(imageOptimisable('https://shop.my365.fr/x.png')).toBe(false);
  });
  test('http, vide, invalide : non', () => {
    expect(imageOptimisable('http://cdn.shopify.com/x.jpg')).toBe(false);
    expect(imageOptimisable(null)).toBe(false);
    expect(imageOptimisable('pas une url')).toBe(false);
  });
  test('un sous-domaine de shopify.com passe, un domaine qui s y termine seulement non', () => {
    expect(imageOptimisable('https://images.shopify.com/x.jpg')).toBe(true);
    expect(imageOptimisable('https://fauxshopify.com/x.jpg')).toBe(false);
  });
});
