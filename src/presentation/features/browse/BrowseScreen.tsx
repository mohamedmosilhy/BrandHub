import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  CategoryRepository,
  GetCategoryProductsUseCase,
  GetProductDetailUseCase,
} from '@domain/catalog';

import { Chip } from '@presentation/components/controls';
import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { ProductGrid } from '@presentation/features/catalog/components';
import {
  productPages,
  useCategories,
  useCategoryProducts,
  useProductPrefetch,
} from '@presentation/features/catalog/useCatalogQueries';
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { useTheme } from '@presentation/theme';

export function BrowseScreen({
  categoryRepository,
  getProductDetail,
  getCategoryProducts,
  onOpenProduct,
}: {
  categoryRepository: CategoryRepository;
  getProductDetail: GetProductDetailUseCase;
  getCategoryProducts: GetCategoryProductsUseCase;
  onOpenProduct: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const categories = useCategories(categoryRepository, locale);
  const [activeRootId, setActiveRootId] = useState('');
  const resolvedRootId = activeRootId || categories.data?.[0]?.id || '';
  const browseFilters = [
    t('browseBestSellers'),
    t('browseNewIn'),
    t('browseUnder20'),
    t('express'),
  ];
  const products = useCategoryProducts(
    getCategoryProducts,
    locale,
    resolvedRootId,
    {},
    Boolean(resolvedRootId),
  );
  const items = productPages(products.data);
  const prefetch = useProductPrefetch(getProductDetail, locale);
  const wishlist = useWishlistCardProps();

  return (
    <Screen accessibilityLabel={t('tabCats')} edgeToEdge gap={0} scroll={false}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h3" weight="extrabold">
          {t('browse')}
        </Text>
      </View>
      {categories.isPending ? (
        <View style={styles.loading}>
          <Skeleton
            accessibilityLabel={t('loading')}
            height={360}
            width={104}
          />
          <Skeleton
            accessibilityLabel={t('loading')}
            height={360}
            width="65%"
          />
        </View>
      ) : categories.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void categories.refetch()}
        />
      ) : (
        <View style={styles.body}>
          <ScrollView
            accessibilityLabel={t('browse')}
            style={[
              styles.rail,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {(categories.data ?? []).map((category) => {
              const selected = category.id === resolvedRootId;
              return (
                <Pressable
                  key={category.id}
                  accessibilityLabel={category.title}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => setActiveRootId(category.id)}
                  style={[
                    styles.railItem,
                    {
                      backgroundColor: selected
                        ? theme.colors.surfaceField
                        : theme.colors.surface,
                      borderStartColor: selected
                        ? theme.colors.accent
                        : theme.colors.transparent,
                    },
                  ]}
                >
                  <Text
                    color={
                      selected
                        ? theme.colors.accent
                        : theme.colors.textSecondary
                    }
                    variant="xxs"
                    weight="bold"
                    style={styles.railLabel}
                  >
                    {category.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.products}>
            <View style={styles.chips}>
              {browseFilters.map((label) => (
                <Chip key={label} density="browse" label={label} />
              ))}
            </View>
            {products.isError ? (
              <ErrorState
                title={t('states:genericErrorTitle')}
                body={t('states:genericErrorBody')}
                actionLabel={t('retry')}
                onAction={() => void products.refetch()}
              />
            ) : products.isPending ? (
              <View style={styles.gridLoading}>
                <Skeleton
                  accessibilityLabel={t('loading')}
                  height={190}
                  width="46%"
                />
                <Skeleton
                  accessibilityLabel={t('loading')}
                  height={190}
                  width="46%"
                />
              </View>
            ) : (
              <ProductGrid
                wishlist={wishlist}
                products={items}
                variant="compact"
                gap={10}
                paddingBottom={14}
                paddingTop={0}
                paddingX={0}
                onOpen={onOpenProduct}
                onPrefetch={prefetch}
                onEndReached={() =>
                  products.hasNextPage &&
                  !products.isFetchingNextPage &&
                  void products.fetchNextPage()
                }
                isFetchingNextPage={products.isFetchingNextPage}
                emptyTitle={t('noResultsFound')}
                emptyBody={t('tryOther')}
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: 'row', minHeight: 0 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  gridLoading: { flexDirection: 'row', gap: 10 },
  // `padding: 14px 18px 10px; background: #fff; border-bottom: 1px solid #E8E8EC`, full bleed.
  header: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  loading: { flexDirection: 'row', gap: 12, padding: 14 },
  // `padding: 14px` around the pane beside the rail.
  products: { flex: 1, gap: 12, minHeight: 0, padding: 14 },
  rail: { alignSelf: 'stretch', borderEndWidth: 1, flexGrow: 0, width: 104 },
  railLabel: { lineHeight: 15 },
  railItem: {
    borderStartWidth: 3,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
});
