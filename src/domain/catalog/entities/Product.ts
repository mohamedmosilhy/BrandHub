import { Money } from '@core/money';

export type ProductImage = Readonly<{
  id: string;
  url: string;
  alt: string;
}>;

export type ProductVariant = Readonly<{
  id: string;
  sku: string;
  attributes: Readonly<Record<string, string>>;
  stock: number;
  price: Money;
}>;

export type Product = Readonly<{
  id: string;
  slug: string;
  categoryId: string;
  sellerId: string;
  title: string;
  description: string;
  price: Money;
  originalPrice: Money | null;
  stock: number;
  featured: boolean;
  createdAt: string;
  salesCount: number;
  rating: Rating;
  reviewCount: number;
  images: readonly ProductImage[];
  variants: readonly ProductVariant[];
}>;

export type Rating = number;

export function rating(value: number): Rating {
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    throw new RangeError('Rating must be between 0 and 5.');
  }
  return value;
}

/** BR11: the API supplies prices; the client derives the percentage. */
export function discountPercent(
  product: Pick<Product, 'price' | 'originalPrice'>,
): number {
  if (!product.originalPrice || product.originalPrice.baisa <= 0) return 0;
  const saving = product.originalPrice.minus(product.price).baisa;
  if (saving <= 0) return 0;
  return Math.round((saving / product.originalPrice.baisa) * 100);
}
