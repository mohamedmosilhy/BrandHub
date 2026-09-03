import { FlashList } from '@shopify/flash-list';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Product } from '@domain/catalog';

import { EmptyState } from '@presentation/components/feedback';
import { toneAt, useTheme } from '@presentation/theme';

import { ProductCard, type ProductCardVariant } from './ProductCard';
import { heartProps, type WishlistCardSource } from './wishlistProps';

export function ProductGrid({
  products,
  variant = 'grid',
  onOpen,
  onPrefetch,
  onEndReached,
  isFetchingNextPage = false,
  emptyTitle,
  emptyBody,
  emptyActionLabel,
  onEmptyAction,
  /** `gap: 12px` on the category grid, `10px` in the browse pane and the search list. */
  gap = 12,
  paddingX = 16,
  paddingTop = 10,
  paddingBottom = 18,
  footer,
  wishlist,
  imageHeight,
}: {
  products: readonly Product[];
  variant?: ProductCardVariant;
  onOpen: (id: string) => void;
  onPrefetch?: (id: string) => void;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  emptyTitle: string;
  emptyBody: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  gap?: number;
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  /** Trails the last row inside the scroller, the way the prototype's page-end actions do. */
  footer?: ReactNode;
  wishlist?: WishlistCardSource;
  imageHeight?: number;
}) {
  const { theme } = useTheme();
  const columns = variant === 'list' ? 1 : 2;
  return (
    <FlashList
      style={styles.list}
      data={[...products]}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.45}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom,
        paddingHorizontal: paddingX,
        paddingTop,
      }}
      ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      ListEmptyComponent={
        <EmptyState
          title={emptyTitle}
          body={emptyBody}
          {...(emptyActionLabel ? { actionLabel: emptyActionLabel } : {})}
          {...(onEmptyAction ? { onAction: onEmptyAction } : {})}
          icon="search"
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : footer ? (
          <View style={{ paddingTop: gap }}>{footer}</View>
        ) : null
      }
      renderItem={({ item, index }) => (
        <View
          style={
            columns === 2
              ? {
                  flex: 1,
                  ...(index % 2 === 0
                    ? { paddingEnd: gap / 2 }
                    : { paddingStart: gap / 2 }),
                }
              : undefined
          }
        >
          <ProductCard
            product={item}
            variant={variant}
            tone={toneAt(index)}
            onOpen={() => onOpen(item.id)}
            onPrefetch={() => onPrefetch?.(item.id)}
            {...(imageHeight === undefined ? {} : { imageHeight })}
            {...heartProps(item, wishlist)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', padding: 20 },
  list: { flex: 1 },
});
