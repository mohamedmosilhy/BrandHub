import { StyleSheet, View } from 'react-native';

import type { Product } from '@domain/catalog';

import { toneAt } from '@presentation/theme';

import { ProductCard, type ProductCardVariant } from './ProductCard';
import { heartProps, type WishlistCardSource } from './wishlistProps';

/**
 * The prototype's home "Today's deals" block is a two-column CSS grid inside the page's own
 * scroller, not a horizontal rail. Nesting a virtualised list inside the home `ScrollView` is
 * what a plain wrapping row avoids.
 */
export function StaticProductGrid({
  products,
  variant = 'deal',
  gap = 12,
  onOpen,
  onPrefetch,
  wishlist,
}: {
  products: readonly Product[];
  variant?: ProductCardVariant;
  gap?: number;
  onOpen: (id: string) => void;
  onPrefetch?: (id: string) => void;
  wishlist?: WishlistCardSource;
}) {
  return (
    <View style={[styles.grid, { gap }]}>
      {products.map((product, index) => (
        <View key={product.id} style={styles.cell}>
          <ProductCard
            product={product}
            variant={variant}
            tone={toneAt(index)}
            onOpen={() => onOpen(product.id)}
            onPrefetch={() => onPrefetch?.(product.id)}
            {...heartProps(product, wishlist)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Two equal columns: each cell is just under half so the gap always fits.
  cell: { flexBasis: '47%', flexGrow: 1, flexShrink: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
