import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { SellerRepository } from '@domain/catalog';

import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { Avatar } from '@presentation/components/surfaces';
import {
  productPages,
  ProductGrid,
  useProductPrefetch,
} from '@presentation/features/catalog';
import {
  storeInitials,
  useSeller,
  useSellerProducts,
} from '@presentation/features/product';
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { formatCount } from '@presentation/formatting';
import { gradients, useTheme } from '@presentation/theme';

/**
 * `design-reference/BRANDHUB App.dc.html`: a 148 px ink-to-indigo cover, a 68 px store tile
 * pulled 34 px up over it, three `#F5F5F7` stat blocks, a tab rule with the "view all" action
 * on its trailing edge, and a two-column product grid.
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
  getProductDetail: import('@domain/catalog').GetProductDetailUseCase;
  onBack: () => void;
  onOpenProduct: (id: string) => void;
  onViewAll: (sellerId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const seller = useSeller(sellerRepository, locale, sellerId);
  const products = useSellerProducts(sellerRepository, locale, sellerId);
  const prefetch = useProductPrefetch(getProductDetail, locale);
  const wishlist = useWishlistCardProps();
  const items = productPages(products.data);

  const stats = seller.data
    ? [
        { value: seller.data.rating.toFixed(1), label: t('ratingFilter') },
        {
          value: formatCount(seller.data.salesCount),
          label: t('salesLabel'),
        },
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
          compactSize={34}
          onPress={onBack}
          style={[styles.back, { borderRadius: theme.radius.full }]}
        >
          <Icon
            name="arrow-back"
            color={theme.colors.textInverse}
            size={theme.iconSizes.sm}
          />
        </Pressable>
      </LinearGradient>

      {seller.isPending ? (
        <View style={styles.loading}>
          <Skeleton accessibilityLabel={t('loading')} height={68} width="60%" />
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
                styles.tile,
                {
                  backgroundColor: theme.colors.surface,
                  boxShadow: theme.shadows.md.boxShadow,
                },
              ]}
            >
              <Avatar
                accessibilityLabel={seller.data.storeName}
                initials={storeInitials(seller.data.storeName)}
                size="lg"
              />
            </View>
            <View style={styles.identityCopy}>
              <Text variant="h3" weight="extrabold">
                {seller.data.storeName}
              </Text>
              <Text color={theme.colors.textMuted} variant="micro">
                {seller.data.verified ? `${t('verifiedSeller')} · ` : ''}
                {t('ratingValue', { value: seller.data.rating.toFixed(1) })}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.stat,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text latin variant="bodyLg" weight="extrabold">
                  {stat.value}
                </Text>
                <Text color={theme.colors.textSecondary} variant="micro">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[styles.tabs, { borderBottomColor: theme.colors.border }]}
          >
            <Text
              color={theme.colors.accent}
              style={[styles.tab, { borderBottomColor: theme.colors.accent }]}
              variant="sm"
              weight="extrabold"
            >
              {t('allProducts')}
            </Text>
            <Pressable
              accessibilityLabel={t('viewAll')}
              compact
              onPress={() => onViewAll(sellerId)}
              style={styles.viewAll}
            >
              <Text color={theme.colors.accent} variant="xs" weight="bold">
                {t('viewAll')}
              </Text>
            </Pressable>
          </View>

          <ProductGrid
            products={items}
            paddingX={18}
            paddingTop={14}
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
    insetInlineStart: 14,
    justifyContent: 'center',
    position: 'absolute',
    top: 14,
  },
  cover: { height: 148 },
  identity: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    marginTop: -34,
    paddingHorizontal: 18,
  },
  identityCopy: { flex: 1, gap: 3, paddingBottom: 4 },
  loading: { padding: 18 },
  stat: { borderRadius: 14, flex: 1, gap: 3, padding: 12 },
  stats: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  tab: { borderBottomWidth: 2.5, paddingBottom: 10 },
  tabs: {
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  tile: { borderRadius: 18, padding: 3 },
  viewAll: { marginInlineStart: 'auto', paddingBottom: 8 },
});
