import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  Category,
  CategoryRepository,
  ProductRepository,
} from '@domain/catalog';

import {
  AsyncBoundary,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen, SectionHeader } from '@presentation/components/layout';
import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { GradientPanel } from '@presentation/components/surfaces';
import {
  CategoryTile,
  StaticProductGrid,
} from '@presentation/features/catalog/components';
import {
  useHomeQueries,
  useProductPrefetch,
} from '@presentation/features/catalog/useCatalogQueries';
import { mobile, toneAt, useTheme } from '@presentation/theme';

const creators = [
  ['influencer-1', 'Layan'],
  ['influencer-2', 'Maha'],
  ['influencer-3', 'Aisha'],
  ['influencer-4', 'Noor'],
  ['influencer-5', 'Salma'],
  ['influencer-6', 'Reem'],
] as const;

function flattenCategories(
  categories: readonly Category[],
): readonly Category[] {
  return categories
    .flatMap((category) => [category, ...category.children])
    .slice(0, 8);
}

export function HomeScreen({
  categoryRepository,
  productRepository,
  onSearch,
  onNotifications,
  onBrowse,
  onOpenCategory,
  onOpenProduct,
  onOpenInfluencer,
}: {
  categoryRepository: CategoryRepository;
  productRepository: ProductRepository;
  onSearch: () => void;
  onNotifications: () => void;
  onBrowse: () => void;
  onOpenCategory: (id: string, name: string) => void;
  onOpenProduct: (id: string) => void;
  onOpenInfluencer: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const queries = useHomeQueries(categoryRepository, productRepository, locale);
  const prefetch = useProductPrefetch(productRepository, locale);
  const categories = flattenCategories(queries.categories.data ?? []);

  return (
    <Screen
      accessibilityLabel={t('tabHome')}
      paddingBottom={theme.spacing.x6}
      paddingTop={theme.spacing.x3}
      paddingX={theme.mobile.homePaddingX}
    >
      <View style={styles.locationRow}>
        <Icon
          name="map-pin"
          color={theme.colors.accent}
          size={theme.iconSizes.sm}
        />
        <View style={styles.flex}>
          <Text color={theme.colors.textMuted} variant="micro">
            {t('deliverTo')}
          </Text>
          <Text variant="xs" weight="bold">
            {t('address')}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('notifications')}
          onPress={onNotifications}
          style={styles.bell}
        >
          <Icon name="bell" />
          <View
            style={[
              styles.unread,
              {
                backgroundColor: theme.colors.pink,
                borderColor: theme.colors.background,
              },
            ]}
          />
        </Pressable>
      </View>

      <Pressable
        accessibilityLabel={t('searchPh')}
        onPress={onSearch}
        style={[
          styles.search,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Icon
          name="search"
          color={theme.colors.textMuted}
          size={theme.iconSizes.sm}
        />
        <Text color={theme.colors.textMuted} style={styles.flex} variant="sm">
          {t('searchPh')}
        </Text>
        <View
          style={[
            styles.searchAction,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Icon
            name="search"
            color={theme.colors.textInverse}
            size={theme.iconSizes.xs}
          />
        </View>
      </Pressable>

      <ScrollView
        accessibilityLabel={t('influencers')}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.creatorRail}
      >
        {creators.map(([id, name]) => (
          <Pressable
            key={id}
            accessibilityLabel={name}
            compact
            onPress={() => onOpenInfluencer(id)}
            style={styles.creator}
          >
            <LinearGradient
              colors={theme.gradients.brand.colors}
              end={theme.gradients.brand.end}
              start={theme.gradients.brand.start}
              style={styles.creatorRing}
            >
              <View
                style={[
                  styles.creatorInner,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text variant="h3" weight="bold">
                  {name[0]}
                </Text>
              </View>
            </LinearGradient>
            <Text
              color={theme.colors.textSecondary}
              numberOfLines={1}
              variant="micro"
            >
              {name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <GradientPanel
        accessibilityLabel={t('weekDeals')}
        paddingX={theme.mobile.promo.paddingX}
        paddingY={theme.mobile.promo.paddingY}
        radius={theme.mobile.promo.radius}
        ring
      >
        <View style={styles.promoRow}>
          <View style={[styles.flex, { gap: theme.mobile.gapTight }]}>
            <Text
              color={theme.colors.textInverse}
              variant="xxs"
              weight="semibold"
            >
              {t('weekDeals')}
            </Text>
            <Text
              color={theme.colors.textInverse}
              variant="h3"
              weight="extrabold"
            >
              {t('promoTitle')}
            </Text>
            <Pressable
              accessibilityLabel={t('shopNow')}
              compact
              onPress={onBrowse}
              style={[
                styles.promoButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Text variant="xs" weight="bold">
                {t('shopNow')}
              </Text>
            </Pressable>
          </View>
          {queries.deals.data?.[0]?.images[0] ? (
            <Image
              accessibilityLabel={queries.deals.data[0].title}
              contentFit="cover"
              source={{ uri: queries.deals.data[0].images[0].url }}
              style={[
                styles.promoImage,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: 'rgba(255,255,255,0.32)',
                },
              ]}
            />
          ) : null}
        </View>
      </GradientPanel>

      <AsyncBoundary
        status={queries.categories.status}
        isEmpty={categories.length === 0}
        loading={
          <View style={styles.categoryGrid}>
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton
                key={index}
                accessibilityLabel={t('loading')}
                height={74}
                width="22%"
              />
            ))}
          </View>
        }
        empty={
          <ErrorState
            title={t('categoryDebugEmpty')}
            body={t('categoryDebugEmptyBody')}
            actionLabel={t('retry')}
            onAction={() => void queries.categories.refetch()}
          />
        }
        error={
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void queries.categories.refetch()}
          />
        }
      >
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <CategoryTile
              key={category.id}
              category={category}
              tone={toneAt(index)}
              onPress={() => onOpenCategory(category.id, category.title)}
            />
          ))}
        </View>
      </AsyncBoundary>

      <SectionHeader
        title={t('todayDeals')}
        actionLabel={t('viewAll')}
        onAction={onBrowse}
      />
      <AsyncBoundary
        status={queries.deals.status}
        isEmpty={!queries.deals.data?.length}
        loading={
          <View style={styles.dealSkeletons}>
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
        }
        empty={<ErrorState title={t('noResultsFound')} body={t('tryOther')} />}
        error={
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void queries.deals.refetch()}
          />
        }
      >
        <StaticProductGrid
          products={queries.deals.data ?? []}
          onOpen={onOpenProduct}
          onPrefetch={prefetch}
        />
      </AsyncBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bell: { alignItems: 'center', justifyContent: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  creator: { alignItems: 'center', gap: 6, width: 64 },
  creatorInner: {
    alignItems: 'center',
    borderRadius: 99,
    flex: 1,
    justifyContent: 'center',
    margin: 3,
  },
  creatorRail: { flexDirection: 'row', gap: 14, overflow: 'hidden' },
  creatorRing: { borderRadius: 99, height: 62, width: 62 },
  dealSkeletons: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  promoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  promoImage: {
    borderRadius: 99,
    borderWidth: mobile.promo.imageBorder,
    height: mobile.promo.imageSize,
    width: mobile.promo.imageSize,
  },
  promoRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  search: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    height: 46,
    paddingHorizontal: 6,
    paddingInlineStart: 16,
  },
  searchAction: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  unread: {
    borderRadius: 99,
    borderWidth: 1.5,
    height: 8,
    insetInlineEnd: 8,
    position: 'absolute',
    top: 7,
    width: 8,
  },
});
