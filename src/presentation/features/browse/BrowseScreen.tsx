import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  Category,
  CategoryRepository,
  GetCategoryProductsUseCase,
  ProductRepository,
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
import { useTheme } from '@presentation/theme';

export function BrowseScreen({
  categoryRepository,
  productRepository,
  getCategoryProducts,
  onOpenProduct,
}: {
  categoryRepository: CategoryRepository;
  productRepository: ProductRepository;
  getCategoryProducts: GetCategoryProductsUseCase;
  onOpenProduct: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const categories = useCategories(categoryRepository, locale);
  const [activeRootId, setActiveRootId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const resolvedRootId = activeRootId || categories.data?.[0]?.id || '';
  const resolvedCategoryId = selectedCategoryId || resolvedRootId;
  const active = useMemo(
    () => categories.data?.find((category) => category.id === resolvedRootId),
    [categories.data, resolvedRootId],
  );
  const products = useCategoryProducts(
    getCategoryProducts,
    locale,
    resolvedCategoryId,
    {},
    Boolean(resolvedCategoryId),
  );
  const items = productPages(products.data);
  const prefetch = useProductPrefetch(productRepository, locale);

  return (
    <Screen accessibilityLabel={t('tabCats')} scroll={false}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
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
                  onPress={() => {
                    setActiveRootId(category.id);
                    setSelectedCategoryId(category.id);
                  }}
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
                  >
                    {category.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.products}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label={t('allProducts')}
                selected={resolvedCategoryId === active?.id}
                onPress={() => active && setSelectedCategoryId(active.id)}
              />
              {(active?.children ?? []).map((category: Category) => (
                <Chip
                  key={category.id}
                  label={category.title}
                  selected={resolvedCategoryId === category.id}
                  onPress={() => setSelectedCategoryId(category.id)}
                />
              ))}
            </ScrollView>
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
                products={items}
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
  body: { flex: 1, flexDirection: 'row' },
  chips: { gap: 7, paddingBottom: 10 },
  gridLoading: { flexDirection: 'row', gap: 10, padding: 12 },
  header: { borderBottomWidth: 1, paddingBottom: 10 },
  loading: { flexDirection: 'row', gap: 12 },
  products: { flex: 1 },
  rail: { borderEndWidth: 1, flexGrow: 0, width: 104 },
  railItem: {
    borderStartWidth: 3,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
});
