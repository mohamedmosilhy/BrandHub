import type { Product } from '@domain/catalog';

/**
 * What a list needs to draw the heart on each of its cards. Structurally identical to what
 * `useWishlistCardProps` returns, and declared here so the catalogue components do not have to
 * import the wishlist feature — that direction would close a cycle through the query keys.
 */
export type WishlistCardSource = Readonly<{
  savedIds: ReadonlySet<string>;
  onWishlist?: ((product: Product) => void) | undefined;
}>;

export function heartProps(product: Product, source?: WishlistCardSource) {
  if (!source?.onWishlist) return {};
  const onWishlist = source.onWishlist;
  return {
    saved: source.savedIds.has(product.id),
    onWishlist: () => onWishlist(product),
  };
}
