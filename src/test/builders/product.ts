import { Money } from '@core/money';

import type { Product } from '@domain/catalog';

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    slug: 'headphones-1',
    categoryId: 'cat-electronics',
    sellerId: 'seller-a2',
    title: 'سماعات لاسلكية',
    description: 'منتج مختار',
    price: Money.fromDecimal('19.900'),
    originalPrice: Money.fromDecimal('25.000'),
    stock: 10,
    featured: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    salesCount: 100,
    rating: 4.8,
    reviewCount: 42,
    images: [
      { id: 'image-1', url: 'https://example.test/product.png', alt: 'سماعات' },
    ],
    variants: [
      {
        id: 'variant-1',
        sku: 'BH-1',
        attributes: { colour: 'Black' },
        stock: 10,
        price: Money.fromDecimal('19.900'),
      },
    ],
    specs: [{ name: 'Colour', value: 'Black' }],
    ...overrides,
  };
}
