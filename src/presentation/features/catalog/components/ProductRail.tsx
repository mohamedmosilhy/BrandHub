import type { Product } from '@domain/catalog';

import { HorizontalRail } from '@presentation/components/layout';

import { ProductCard } from './ProductCard';

export function ProductRail({
  products,
  label,
  onOpen,
  onPrefetch,
}: {
  products: readonly Product[];
  label: string;
  onOpen: (id: string) => void;
  onPrefetch?: (id: string) => void;
}) {
  return (
    <HorizontalRail accessibilityLabel={label}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variant="rail"
          onOpen={() => onOpen(product.id)}
          onPrefetch={() => onPrefetch?.(product.id)}
        />
      ))}
    </HorizontalRail>
  );
}
