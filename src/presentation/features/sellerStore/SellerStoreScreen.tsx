import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  GetProductDetailUseCase,
  SellerRepository,
} from '@domain/catalog';

import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Pressable, Text } from '@presentation/components/primitives';
import {
  productPages,
  ProductGrid,
  useProductPrefetch,
} from '@presentation/features/catalog';
import {
  StoreTile,
  useSeller,
  useSellerProducts,
} from '@presentation/features/product';
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { formatCount } from '@presentation/formatting';
import { gradients, mobile, useTheme } from '@presentation/theme';

/**
 * `design-reference/BRANDHUB App.dc.html`, element by element: a 148 px ink-to-indigo cover with
 * a `34px` translucent back control, a `68px` store tile with a 3 px white edge pulled 34 px up
 * over the cover, the store name at `14px/800` beside a `34px` follow pill, three `#F5F5F7` stat
 * blocks, the tab rule carrying "all products" and "about" with "view all" on its trailing edge,
 * and a two-column product grid on an 18 px gutter.
 */
export function SellerStoreScreen({
  sellerId,
  sellerRepository,
  getProductDetail,
  onBack,
  onOpenProduct,
  onViewAll,
}: {
  sellerId: string;
  sellerRepository: SellerRepository;
  getProductDetail: GetProductDetailUseCase;
  onBack: () => void;
  onOpenProduct: (id: string) => void;
  onViewAll: (sellerId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const store = theme.mobile.sellerStore;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const seller = useSeller(sellerRepository, locale, sellerId);
  const products = useSellerProducts(sellerRepository, locale, sellerId);
  const prefetch = useProductPrefetch(getProductDetail, locale);
  const wishlist = useWishlistCardProps();
  const items = productPages(products.data);

  const stats = seller.data
    ? [
        { value: seller.data.rating.toFixed(1), label: t('rating') },
        { value: formatCount(seller.data.salesCount), label: t('sales') },
        {
          value: String(products.data?.pages[0]?.total ?? 0),
          label: t('products'),
        },
      ]
    : [];

  return (
    <Screen
      accessibilityLabel={seller.data?.storeName ?? t('sellerStore')}
      background={theme.colors.surface}
      bottomInset
      edgeToEdge
      gap={0}
      scroll={false}
    >
      <LinearGradient
        colors={[...gradients.sellerCover.colors]}
        start={gradients.sellerCover.start}
        end={gradients.sellerCover.end}
        style={styles.cover}
      >
        <Pressable
          accessibilityLabel={t('back')}
          compact
          compactSize={store.backSize}
          onPress={onBack}
          style={[styles.back, { borderRadius: theme.radius.full }]}
        >
          <Icon
            name="arrow-back"
            color={theme.colors.textInverse}
            size={store.backIconSize}
          />
        </Pressable>
      </LinearGradient>

      {seller.isPending ? (
        <View style={styles.loading}>
          <Skeleton
            accessibilityLabel={t('loading')}
            height={store.tileSize}
            width="60%"
          />
        </View>
      ) : seller.isError || !seller.data ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void seller.refetch()}
        />
      ) : (
        <>
          <View style={styles.identity}>
            <View
              style={[
                styles.tileFrame,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: store.tileRadius,
                  boxShadow: theme.shadows.md.boxShadow,
                  padding: store.tileBorder,
                },
              ]}
            >
              <StoreTile
                storeName={seller.data.storeName}
                size={store.tileSize}
                radius={store.tileRadius - store.tileBorder}
                textVariant="h2"
              />
            </View>
            <View style={styles.identityCopy}>
              {/* `font-size: 14px; font-weight: 800` — smaller than a screen title. */}
              <Text style={styles.storeName} variant="body" weight="extrabold">
                {seller.data.storeName}
              </Text>
              <Text color={theme.colors.textMuted} variant="xxs">
                {seller.data.verified ? `${t('verifiedSeller')} · ` : ''}
                {t('ratingValue', { value: seller.data.rating.toFixed(1) })}
              </Text>
            </View>
            {/*
              The prototype's follow pill. Following a seller has no contract — FA1 covers
              influencer follows only — so it states the relationship without claiming to
              persist it, and is disabled rather than silently doing nothing.
            */}
            <View
              accessibilityLabel={t('follow')}
              accessibilityState={{ disabled: true }}
              style={[
                styles.follow,
                {
                  backgroundColor: theme.colors.accentHover,
                  borderRadius: theme.radius.full,
                  height: store.followHeight,
                  paddingHorizontal: store.followPaddingX,
                },
              ]}
            >
              <Text color={theme.colors.textInverse} variant="xs" weight="bold">
                {t('follow')}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.stat,
                  {
                    backgroundColor: theme.colors.background,
                    borderRadius: store.statRadius,
                    padding: store.statPadding,
                  },
                ]}
              >
                <Text latin variant="bodyLg" weight="extrabold">
                  {stat.value}
                </Text>
                <Text color={theme.colors.textSecondary} variant="nano">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[styles.tabs, { borderBottomColor: theme.colors.border }]}
          >
            <Text
              color={theme.colors.accentHover}
              style={[
                styles.tab,
                {
                  borderBottomColor: theme.colors.accent,
                  borderBottomWidth: store.tabIndicatorWidth,
                },
              ]}
              variant="sm"
              weight="extrabold"
            >
              {t('allProducts')}
            </Text>
            {/* The prototype's second tab. Seller profiles have no contract, so it is inert. */}
            <Text
              color={theme.colors.textMuted}
              style={styles.tab}
              variant="sm"
              weight="semibold"
            >
              {t('about')}
            </Text>
            <Pressable
              accessibilityLabel={t('viewAll')}
              compact
              onPress={() => onViewAll(sellerId)}
              style={styles.viewAll}
            >
              <Text color={theme.colors.accentHover} variant="xs" weight="bold">
                {t('viewAll')}
              </Text>
            </Pressable>
          </View>

          <ProductGrid
            products={items}
            imageHeight={store.productImageHeight}
            paddingX={store.paddingX}
            paddingTop={14}
            paddingBottom={24}
            emptyTitle={t('noResultsFound')}
            emptyBody={t('tryOther')}
            isFetchingNextPage={products.isFetchingNextPage}
            wishlist={wishlist}
            onOpen={onOpenProduct}
            onPrefetch={prefetch}
            onEndReached={() =>
              products.hasNextPage &&
              !products.isFetchingNextPage &&
              void products.fetchNextPage()
            }
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    insetInlineStart: mobile.sellerStore.backInset,
    justifyContent: 'center',
    position: 'absolute',
    top: mobile.sellerStore.backInset,
  },
  cover: { height: mobile.sellerStore.coverHeight },
  follow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  identity: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    marginTop: mobile.sellerStore.tileOverlap,
    paddingHorizontal: mobile.sellerStore.paddingX,
  },
  identityCopy: { flex: 1, gap: 3, paddingBottom: 4 },
  loading: { padding: mobile.sellerStore.paddingX },
  stat: { flex: 1, gap: 3 },
  stats: {
    flexDirection: 'row',
    gap: mobile.sellerStore.statGap,
    paddingHorizontal: mobile.sellerStore.paddingX,
    paddingTop: 18,
  },
  storeName: { fontSize: 14 },
  /** The prototype's `border: 3px solid #fff` around the tile, drawn as padding on a white box. */
  tileFrame: {},
  tab: { paddingBottom: mobile.sellerStore.tabPaddingBottom },
  tabs: {
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: mobile.sellerStore.tabGap,
    paddingHorizontal: mobile.sellerStore.paddingX,
    paddingTop: 14,
  },
  viewAll: { marginBottom: 8, marginInlineStart: 'auto' },
});
