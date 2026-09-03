import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  CategoryRepository,
  GetCategoryProductsUseCase,
  GetProductDetailUseCase,
  SearchCriteria,
} from '@domain/catalog';

import { Button, Chip, Switch } from '@presentation/components/controls';
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
  categoryArtworkSource,
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
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { toneAt, useTheme } from '@presentation/theme';

export function CategoryScreen({
  categoryId,
  categoryRepository,
  getProductDetail,
  getCategoryProducts,
  onBack,
  onSearch,
  onOpenProduct,
}: {
  categoryId: string;
  categoryRepository: CategoryRepository;
  getProductDetail: GetProductDetailUseCase;
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
  const prefetch = useProductPrefetch(getProductDetail, locale);
  const wishlist = useWishlistCardProps();
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
  // `category.tone` in the prototype: the hero band takes the category's own tint from the
  // `TONES` rotation. The prototype indexes by list position, which this screen does not have,
  // so the id is folded into the same five-step rotation — stable per category either way.
  const heroTone = toneAt(
    [...categoryId].reduce((sum, char) => sum + char.charCodeAt(0), 0),
  );

  return (
    <Screen
      accessibilityLabel={category.data?.title ?? t('category')}
      background={theme.colors.surface}
      edgeToEdge
      gap={0}
      scroll={false}
    >
      {category.isPending ? (
        <View style={styles.heroLoading}>
          <Skeleton accessibilityLabel={t('loading')} height={150} />
        </View>
      ) : category.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void category.refetch()}
        />
      ) : category.data ? (
        <View style={[styles.hero, { backgroundColor: heroTone }]}>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityLabel={t('back')}
              compact
              onPress={onBack}
              style={[styles.iconButton, { borderRadius: theme.radius.full }]}
            >
              <Icon name="arrow-back" size={theme.iconSizes.sm} />
            </Pressable>
            <Pressable
              accessibilityLabel={t('search')}
              compact
              onPress={() => onSearch(categoryId)}
              style={[styles.iconButton, { borderRadius: theme.radius.full }]}
            >
              <Icon name="search" size={theme.iconSizes.sm} />
            </Pressable>
          </View>
          <View style={styles.heroBody}>
            <View style={[styles.flex, { gap: theme.mobile.gapHairline }]}>
              <Text variant="h2Compact" weight="extrabold">
                {category.data.title}
              </Text>
              <Text color={theme.colors.textSecondary} variant="xs">
                {t('categoryDescription')}
              </Text>
              {/* "12 منتج" is an Arabic run with a numeral in it, not a Latin run. */}
              <Text
                color={theme.colors.accentHover}
                variant="xxs"
                weight="bold"
              >
                {total} {t('products')}
              </Text>
            </View>
            <Image
              accessibilityLabel={category.data.title}
              contentFit="contain"
              source={categoryArtworkSource(
                category.data.imageUrl,
                category.data.id,
              )}
              style={[
                styles.heroImage,
                { borderRadius: theme.mobile.categoryHero.imageRadius },
              ]}
            />
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.chipRow, { borderBottomColor: theme.colors.border }]}
        contentContainerStyle={styles.chips}
      >
        <Chip label={t('allProducts')} selected tone="muted" />
        {(category.data?.children ?? []).map((child) => (
          <Chip
            key={child.id}
            label={child.title}
            tone="muted"
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
            wishlist={wishlist}
            products={items}
            gap={12}
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
            footer={
              <Button
                fullWidth
                label={t('allProducts')}
                size="md"
                style={styles.allProducts}
                variant="secondary"
                onPress={() => onSearch(categoryId)}
              />
            }
          />
        )}
      </View>

      <Sheet
        visible={sheetOpen}
        title={t('filters')}
        actionLabel={t('clearFilters')}
        closeLabel={t('close')}
        onAction={() => setDraft(emptyFilterDraft)}
        onClose={() => setSheetOpen(false)}
      >
        <FilterSheetContent
          value={draft}
          matchCount={previewTotal}
          labels={filterLabels}
          onChange={setDraft}
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
  /** `height: 46px; border-radius: 14px` page-end action, measured off the prototype. */
  allProducts: { height: 46 },
  // `padding: 12px 16px; border-bottom: 1px solid #E8E8EC` sub-category rail.
  chipRow: { borderBottomWidth: 1, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
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
  // `padding: 14px 16px 20px` on the category's own tint, full bleed and square-cornered.
  hero: { gap: 14, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 14 },
  heroActions: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBody: { alignItems: 'flex-end', flexDirection: 'row', gap: 12 },
  heroImage: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    height: 78,
    width: 78,
  },
  heroLoading: { padding: 16 },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  list: { flex: 1 },
  loading: { flexDirection: 'row', gap: 12, padding: 16 },
});
