import type { Product } from '@domain/catalog';

/**
 * `GET /wishlist` answers with the saved products themselves rather than with join rows, so the
 * item carries the product it points at. Membership is the id; the product is what the wishlist
 * screen and every heart on a card renders.
 */
export type WishlistItem = Readonly<{
  productId: string;
  product: Product;
}>;

export function wishlistIds(
  items: readonly WishlistItem[],
): ReadonlySet<string> {
  return new Set(items.map((item) => item.productId));
}
