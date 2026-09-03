import { discountPercent } from '@domain/catalog';

import { mapProduct, mapProductPage } from './productMapper';

const dto = {
  id: 'product-1',
  slug: 'headphones-1',
  categoryId: 'cat-electronics',
  sellerId: 'seller-a2',
  name: 'Headphones',
  description: 'Quiet',
  basePrice: 25,
  salePrice: 19.9,
  currency: 'OMR' as const,
  stock: 9,
  featured: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  salesCount: 10,
  averageRating: 4.8,
  reviewCount: 42,
  images: [{ id: 'image-1', url: '/image.png', alt: 'Headphones' }],
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-1',
      attributes: { colour: 'Black' },
      stock: 9,
      price: 19.9,
    },
  ],
  specs: [],
};

describe('product mapper', () => {
  it('maps money, card rating metadata, variants and resolved images', () => {
    const product = mapProduct(dto, (url) => `https://api.test${url}`);
    expect(product.price.toDecimalString()).toBe('19.900');
    expect(product.originalPrice?.toDecimalString()).toBe('25.000');
    expect(discountPercent(product)).toBe(20);
    expect(product.rating).toBe(4.8);
    expect(product.reviewCount).toBe(42);
    expect(product.images[0]?.url).toBe('https://api.test/image.png');
    expect(product.variants[0]?.price.toDecimalString()).toBe('19.900');
  });

  it('maps an empty final page as successful empty content', () => {
    expect(
      mapProductPage({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        first: true,
        last: true,
      }),
    ).toEqual({ items: [], page: 0, size: 20, total: 0, hasNext: false });
  });
});
