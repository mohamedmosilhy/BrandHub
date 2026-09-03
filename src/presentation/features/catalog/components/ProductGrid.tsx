import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { Product } from '@domain/catalog';

import { EmptyState } from '@presentation/components/feedback';
import { useTheme } from '@presentation/theme';

import { ProductCard, type ProductCardVariant } from './ProductCard';

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
}) {
  const { theme } = useTheme();
  const grid = variant === 'grid';
  return (
    <FlashList
      data={[...products]}
      keyExtractor={(item) => item.id}
      numColumns={grid ? 2 : 1}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.45}
      contentContainerStyle={{ padding: theme.spacing.x4 }}
      ItemSeparatorComponent={() => (
        <View style={{ height: theme.spacing.x3 }} />
      )}
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
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={
            grid ? { flex: 1, paddingHorizontal: theme.spacing.x1 } : undefined
          }
        >
          <ProductCard
            product={item}
            variant={variant}
            onOpen={() => onOpen(item.id)}
            onPrefetch={() => onPrefetch?.(item.id)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', padding: 20 },
});
