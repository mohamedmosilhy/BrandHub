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
  specs: readonly ProductSpec[];
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

export type ProductSpec = Readonly<{ name: string; value: string }>;

/**
 * D8: `POST /cart/items` requires a `variantId`, which the prototype's decorative colour
 * swatches could never supply. A product with exactly one variant resolves to it silently and
 * the PDP hides the selector; anything else has to be chosen before the item can be added.
 */
export function resolveVariant(
  product: Pick<Product, 'variants'>,
  selectedId: string | null = null,
): ProductVariant | null {
  if (product.variants.length === 1) return product.variants[0] ?? null;
  if (!selectedId) return null;
  return product.variants.find((variant) => variant.id === selectedId) ?? null;
}

/** True when the buyer has to make a choice before add-to-cart can be enabled (D8). */
export function requiresVariantChoice(
  product: Pick<Product, 'variants'>,
): boolean {
  return product.variants.length > 1;
}

export function isInStock(
  product: Pick<Product, 'stock'>,
  variant: Pick<ProductVariant, 'stock'> | null = null,
): boolean {
  return (variant ? variant.stock : product.stock) > 0;
}
