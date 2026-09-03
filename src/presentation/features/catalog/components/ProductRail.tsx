import type { Product } from '@domain/catalog';

import { HorizontalRail } from '@presentation/components/layout';
import { toneAt } from '@presentation/theme';

import { ProductCard } from './ProductCard';
import { heartProps, type WishlistCardSource } from './wishlistProps';

export function ProductRail({
  products,
  label,
  onOpen,
  onPrefetch,
  wishlist,
}: {
  products: readonly Product[];
  label: string;
  onOpen: (id: string) => void;
  onPrefetch?: (id: string) => void;
  wishlist?: WishlistCardSource;
}) {
  return (
    <HorizontalRail accessibilityLabel={label}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          tone={toneAt(index)}
          variant="rail"
          onOpen={() => onOpen(product.id)}
          onPrefetch={() => onPrefetch?.(product.id)}
          {...heartProps(product, wishlist)}
        />
      ))}
    </HorizontalRail>
  );
}
