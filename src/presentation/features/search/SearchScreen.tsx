import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type {
  ProductRepository,
  ProductSort,
  SearchCriteria,
  SearchProductsUseCase,
} from '@domain/catalog';

import { Chip } from '@presentation/components/controls';
import { ErrorState } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Pressable, Text } from '@presentation/components/primitives';
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
  useProductPrefetch,
  useSearchProducts,
} from '@presentation/features/catalog/useCatalogQueries';
import { textStart, useTheme, writingDirection } from '@presentation/theme';

const sortOptions: readonly [ProductSort, string][] = [
  ['relevance', 'sRelevant'],
  ['top-rated', 'sTop'],
  ['price-asc', 'sLow'],
  ['price-desc', 'sHigh'],
];

export function SearchScreen({
  initialQuery = '',
  sellerId,
  categoryId,
  productRepository,
  searchProducts,
  onBack,
  onOpenProduct,
}: {
  initialQuery?: string;
  sellerId?: string;
  categoryId?: string;
  productRepository: ProductRepository;
  searchProducts: SearchProductsUseCase;
  onBack: () => void;
  onOpenProduct: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme, isRTL } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [query, setQuery] = useState(initialQuery);
  const [liveQuery, setLiveQuery] = useState(initialQuery.trim());
  const [scope, setScope] = useState(sellerId);
  const [scopeCleared, setScopeCleared] = useState(false);
  const [filters, setFilters] = useState<SearchCriteria>({ sort: 'relevance' });
  const [draft, setDraft] = useState<FilterDraft>(emptyFilterDraft);
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLiveQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const criteria = useMemo<SearchCriteria>(
    () => ({
      ...filters,
      ...(liveQuery ? { query: liveQuery } : {}),
      ...(scope ? { sellerId: scope } : {}),
      ...(categoryId ? { categoryId } : {}),
    }),
    [categoryId, filters, liveQuery, scope],
  );
  const activeFilterCount =
    (filters.inStock ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.minRating !== undefined ? 1 : 0);
  const hasFilters = activeFilterCount > 0;
  const hasIntent = Boolean(
    liveQuery ||
    scope ||
    categoryId ||
    hasFilters ||
    filters.sort !== 'relevance' ||
    scopeCleared,
  );
  const results = useSearchProducts(
    searchProducts,
    locale,
    criteria,
    hasIntent,
  );
  const previewCriteria = useMemo(
    () => ({
      ...filterDraftToCriteria(draft),
      ...(liveQuery ? { query: liveQuery } : {}),
      ...(scope ? { sellerId: scope } : {}),
      ...(categoryId ? { categoryId } : {}),
    }),
    [categoryId, draft, liveQuery, scope],
  );
  const preview = useSearchProducts(
    searchProducts,
    locale,
    previewCriteria,
    sheetOpen,
    1,
  );
  const items = productPages(results.data);
  const total = results.data?.pages[0]?.total ?? 0;
  const previewTotal = preview.data?.pages[0]?.total ?? 0;
  const prefetch = useProductPrefetch(productRepository, locale);
  const trending = locale.startsWith('ar')
    ? ['سماعات', 'ساعة ذكية', 'قهوة', 'حذاء رياضي']
    : ['headphones', 'smart watch', 'coffee', 'running shoes'];
  const labels = {
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

  const clearFilters = () => {
    setFilters({ sort: 'relevance' });
    setDraft(emptyFilterDraft);
  };

  return (
    <Screen accessibilityLabel={t('search')} scroll={false}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          accessibilityLabel={t('back')}
          onPress={onBack}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" />
        </Pressable>
        <View
          style={[
            styles.searchShell,
            {
              backgroundColor: theme.colors.background,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Icon
            name="search"
            color={theme.colors.textMuted}
            size={theme.iconSizes.sm}
          />
          <TextInput
            accessibilityLabel={t('searchPh')}
            onChangeText={setQuery}
            placeholder={t('searchPh')}
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontFamily:
                  theme.fontFamilies[isRTL ? 'arabic' : 'latin'].regular,
                fontSize: theme.fontSizes.sm,
                textAlign: textStart(isRTL),
                writingDirection: writingDirection(isRTL),
              },
            ]}
          />
        </View>
      </View>

      <View style={{ gap: theme.spacing.x2 }}>
        <Text variant="xs" weight="bold">
          {t('trending')}
        </Text>
        <View style={styles.trending}>
          {trending.map((term) => (
            <Chip key={term} label={term} onPress={() => setQuery(term)} />
          ))}
        </View>
      </View>

      {scope ? (
        <Chip
          label={`${locale.startsWith('ar') ? 'منتجات' : 'Products from'} ${scope}`}
          removable
          removeAccessibilityLabel={`${t('remove')} ${scope}`}
          selected
          onRemove={() => {
            setScope(undefined);
            setScopeCleared(true);
          }}
        />
      ) : null}

      <View style={styles.resultHeader}>
        <Text variant="xs" weight="bold">
          {hasIntent ? `${total} ${t('results')}` : t('noResults')}
        </Text>
        <Pressable
          accessibilityLabel={t('filters')}
          compact
          onPress={() => setSheetOpen(true)}
          style={[
            styles.filterButton,
            {
              borderColor: hasFilters
                ? theme.colors.accent
                : theme.colors.border,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Icon
            name="filter"
            color={hasFilters ? theme.colors.accent : theme.colors.textPrimary}
            size={theme.iconSizes.xs}
          />
          <Text
            color={hasFilters ? theme.colors.accent : theme.colors.textPrimary}
            variant="xs"
            weight="bold"
          >
            {hasFilters
              ? `${t('filters')} (${activeFilterCount})`
              : t('filters')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sorts}
      >
        {sortOptions.map(([value, key]) => (
          <Chip
            key={value}
            label={t(key)}
            selected={(filters.sort ?? 'relevance') === value}
            onPress={() => {
              setFilters((current) => ({ ...current, sort: value }));
              setDraft((current) => ({ ...current, sort: value }));
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.results}>
        {!hasIntent ? (
          <View style={styles.prompt}>
            <Icon
              name="search"
              color={theme.colors.textMuted}
              size={theme.iconSizes.lg}
            />
            <Text align="center" color={theme.colors.textMuted}>
              {t('noResults')}
            </Text>
          </View>
        ) : results.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void results.refetch()}
          />
        ) : results.isPending ? (
          <View style={styles.prompt}>
            <Text color={theme.colors.textMuted}>{t('loading')}</Text>
          </View>
        ) : (
          <ProductGrid
            products={items}
            variant="list"
            onOpen={onOpenProduct}
            onPrefetch={prefetch}
            onEndReached={() =>
              results.hasNextPage &&
              !results.isFetchingNextPage &&
              void results.fetchNextPage()
            }
            isFetchingNextPage={results.isFetchingNextPage}
            emptyTitle={t('noResultsFound')}
            emptyBody={t('tryOther')}
            emptyActionLabel={t('clearFilters')}
            onEmptyAction={clearFilters}
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
          labels={labels}
          onChange={setDraft}
          onClear={() => setDraft(emptyFilterDraft)}
          onApply={(next) => {
            setFilters(next);
            setSheetOpen(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 32,
    paddingHorizontal: 13,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 12,
  },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: 0 },
  prompt: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: 48,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  results: { flex: 1 },
  searchShell: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
  },
  sorts: { gap: 8 },
  trending: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
