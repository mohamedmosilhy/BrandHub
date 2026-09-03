import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  CategoryRepository,
  GetCategoryProductsUseCase,
  ProductRepository,
  SearchCriteria,
} from '@domain/catalog';

import { Chip, Switch } from '@presentation/components/controls';
import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { Sheet } from '@presentation/components/surfaces';
import {
  emptyFilterDraft,
  filterDraftToCriteria,
  FilterSheetContent,
  type FilterDraft,
  ProductGrid,
} from '@presentation/features/catalog/components';
import {
  productPages,
  useCategory,
  useCategoryProducts,
  useProductPrefetch,
} from '@presentation/features/catalog/useCatalogQueries';
import { useTheme } from '@presentation/theme';

export function CategoryScreen({
  categoryId,
  categoryRepository,
  productRepository,
  getCategoryProducts,
  onBack,
  onSearch,
  onOpenProduct,
}: {
  categoryId: string;
  categoryRepository: CategoryRepository;
  productRepository: ProductRepository;
  getCategoryProducts: GetCategoryProductsUseCase;
  onBack: () => void;
  onSearch: (categoryId: string) => void;
  onOpenProduct: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [filters, setFilters] = useState<SearchCriteria>({ sort: 'relevance' });
  const [draft, setDraft] = useState<FilterDraft>(emptyFilterDraft);
  const [sheetOpen, setSheetOpen] = useState(false);
  const category = useCategory(categoryRepository, locale, categoryId);
  const products = useCategoryProducts(
    getCategoryProducts,
    locale,
    categoryId,
    filters,
  );
  const preview = useCategoryProducts(
    getCategoryProducts,
    locale,
    categoryId,
    filterDraftToCriteria(draft),
    sheetOpen,
  );
  const items = productPages(products.data);
  const total = products.data?.pages[0]?.total ?? 0;
  const previewTotal = preview.data?.pages[0]?.total ?? 0;
  const prefetch = useProductPrefetch(productRepository, locale);
  const filterLabels = {
    sortBy: t('sortBy'),
    relevance: t('sRelevant'),
    topRated: t('sTop'),
    priceAsc: t('sLow'),
    priceDesc: t('sHigh'),
    inStock: t('inStock'),
    priceRange: t('priceRange'),
    minPrice: t('minPrice'),
    maxPrice: t('maxPrice'),
    rating: t('ratingFilter'),
    rating4: t('r4up'),
    rating3: t('r3up'),
    rating2: t('r2up'),
    clear: t('clearFilters'),
    apply: t('applyFilters'),
    results: t('results'),
  };

  return (
    <Screen
      accessibilityLabel={category.data?.title ?? t('category')}
      scroll={false}
    >
      {category.isPending ? (
        <Skeleton accessibilityLabel={t('loading')} height={150} />
      ) : category.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void category.refetch()}
        />
      ) : category.data ? (
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.accentLight,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <View style={styles.heroActions}>
            <Pressable
              accessibilityLabel={t('back')}
              compact
              onPress={onBack}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Icon name="arrow-back" size={theme.iconSizes.sm} />
            </Pressable>
            <Pressable
              accessibilityLabel={t('search')}
              compact
              onPress={() => onSearch(categoryId)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Icon name="search" size={theme.iconSizes.sm} />
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <View style={[styles.flex, { gap: theme.mobile.gapHairline }]}>
              <Text variant="h1" weight="extrabold">
                {category.data.title}
              </Text>
              <Text color={theme.colors.textSecondary} variant="xs">
                {t('categoryDescription')}
              </Text>
              <Text
                color={theme.colors.accentHover}
                latin
                variant="xxs"
                weight="bold"
              >
                {total} {t('products')}
              </Text>
            </View>
            <Image
              accessibilityLabel={category.data.title}
              contentFit="contain"
              source={{ uri: category.data.imageUrl }}
              style={[
                styles.heroImage,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.lg,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label={t('allProducts')} selected />
        {(category.data?.children ?? []).map((child) => (
          <Chip
            key={child.id}
            label={child.title}
            onPress={() => onSearch(child.id)}
          />
        ))}
      </ScrollView>
      <View style={styles.controls}>
        <Switch
          label={t('inStock')}
          value={Boolean(filters.inStock)}
          onValueChange={(inStock) => {
            setFilters((current) => {
              if (inStock) return { ...current, inStock: true };
              const { inStock: _removed, ...rest } = current;
              return rest;
            });
            setDraft((current) => ({ ...current, inStock }));
          }}
        />
        <Pressable
          accessibilityLabel={t('filters')}
          compact
          onPress={() => setSheetOpen(true)}
          style={[
            styles.filterButton,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Icon name="filter" size={theme.iconSizes.xs} />
          <Text variant="xs" weight="bold">
            {t('filters')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {products.isPending ? (
          <View style={styles.loading}>
            <Skeleton
              accessibilityLabel={t('loading')}
              height={210}
              width="47%"
            />
            <Skeleton
              accessibilityLabel={t('loading')}
              height={210}
              width="47%"
            />
          </View>
        ) : products.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void products.refetch()}
          />
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
            emptyActionLabel={t('allProducts')}
            onEmptyAction={() => {
              setFilters({ sort: 'relevance' });
              setDraft(emptyFilterDraft);
            }}
          />
        )}
      </View>

      <Sheet
        visible={sheetOpen}
        title={t('filters')}
        closeLabel={t('close')}
        onClose={() => setSheetOpen(false)}
      >
        <FilterSheetContent
          value={draft}
          matchCount={previewTotal}
          labels={filterLabels}
          onChange={setDraft}
          onClear={() => setDraft(emptyFilterDraft)}
          onApply={(criteria) => {
            setFilters(criteria);
            setSheetOpen(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8 },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 32,
    paddingHorizontal: 13,
  },
  flex: { flex: 1 },
  hero: { gap: 12, padding: 14 },
  heroActions: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBody: { alignItems: 'flex-end', flexDirection: 'row', gap: 12 },
  heroImage: { height: 78, width: 78 },
  iconButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  list: { flex: 1 },
  loading: { flexDirection: 'row', gap: 12, padding: 10 },
});
