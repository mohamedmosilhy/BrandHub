import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  discountPercent,
  isInStock,
  resolveVariant,
  type GetProductDetailUseCase,
  type GetRelatedProductsUseCase,
  type ReviewRepository,
  type SellerRepository,
} from '@domain/catalog';

import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Text } from '@presentation/components/primitives';
import { Badge } from '@presentation/components/surfaces';
import { ProductRail } from '@presentation/features/catalog/components';
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { formatPrice } from '@presentation/formatting';
import { toneAt, useTheme } from '@presentation/theme';

import {
  BuyBar,
  ProductGallery,
  ProductReviews,
  ProductSpecs,
  SellerStrip,
  VariantSelector,
} from './components';
import {
  useProductDetail,
  useProductReviews,
  useRelatedProducts,
  useSeller,
} from './useProductQueries';

export function ProductScreen({
  productId,
  getProductDetail,
  getRelatedProducts,
  reviewRepository,
  sellerRepository,
  onBack,
  onCart,
  onOpenProduct,
  onOpenSeller,
  onAddedToCart,
  onBuyNow,
}: {
  productId: string;
  getProductDetail: GetProductDetailUseCase;
  getRelatedProducts: GetRelatedProductsUseCase;
  reviewRepository: ReviewRepository;
  sellerRepository: SellerRepository;
  onBack: () => void;
  onCart: () => void;
  onOpenProduct: (id: string) => void;
  onOpenSeller: (id: string) => void;
  onAddedToCart: (message: string) => void;
  onBuyNow: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const reviewLocale = locale.startsWith('ar') ? 'ar' : 'en';
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const wishlist = useWishlistCardProps();

  const detail = useProductDetail(getProductDetail, locale, productId);
  const product = detail.data?.product;
  const related = useRelatedProducts(getRelatedProducts, locale, productId);
  const reviews = useProductReviews(reviewRepository, locale, productId);
  const seller = useSeller(
    sellerRepository,
    locale,
    product?.sellerId ?? '',
    Boolean(product),
  );

  // D8: one variant resolves itself; anything else waits for a choice before the bar unlocks.
  const variant = product ? resolveVariant(product, selectedVariantId) : null;
  const needsChoice = Boolean(detail.data?.requiresVariantChoice) && !variant;
  const soldOut = Boolean(product) && !isInStock(product!, variant);
  const price = variant?.price ?? product?.price;
  const discount = product ? discountPercent(product) : 0;
  const reviewItems = reviews.data?.pages.flatMap((page) => page.items) ?? [];
  const reviewTotal =
    reviews.data?.pages[0]?.total ?? product?.reviewCount ?? 0;

  if (detail.isPending) {
    return (
      <Screen
        accessibilityLabel={t('product')}
        edgeToEdge
        gap={0}
        scroll={false}
      >
        <Skeleton accessibilityLabel={t('loading')} height={300} />
        <View style={styles.loadingCopy}>
          <Skeleton accessibilityLabel={t('loading')} height={22} width="70%" />
          <Skeleton accessibilityLabel={t('loading')} height={30} width="40%" />
        </View>
      </Screen>
    );
  }

  if (detail.isError || !product) {
    return (
      <Screen accessibilityLabel={t('product')}>
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void detail.refetch()}
        />
      </Screen>
    );
  }

  const addLabel = soldOut
    ? t('outOfStock')
    : needsChoice
      ? t('chooseVariantFirst')
      : null;

  return (
    <Screen
      accessibilityLabel={product.title}
      background={theme.colors.surface}
      bottomInset
      edgeToEdge
      gap={0}
      scroll={false}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery
          product={product}
          tone={toneAt(product.id.length)}
          saved={wishlist.savedIds.has(product.id)}
          onBack={onBack}
          onCart={onCart}
          onToggleWishlist={() => wishlist.onWishlist?.(product)}
        />

        <View style={styles.body}>
          <View style={styles.badges}>
            {/* D21 holds Express back until the API carries it; the discount badge is derived. */}
            {discount > 0 ? (
              <Badge label={`-${discount}%`} tone="pink" />
            ) : null}
            {soldOut ? <Badge label={t('outOfStock')} tone="neutral" /> : null}
          </View>

          <Text variant="bodyLg" weight="bold">
            {product.title}
          </Text>

          <View style={styles.ratingRow}>
            <Icon
              name="star"
              color={theme.colors.rating}
              filled
              size={theme.iconSizes.xs}
            />
            <Text latin variant="sm" weight="bold">
              {product.rating.toFixed(1)}
            </Text>
            <Text color={theme.colors.textMuted} variant="micro">
              {t('reviewCount', { count: reviewTotal })}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text latin variant="h2" weight="extrabold">
              {formatPrice((price ?? product.price).toDecimal())}
            </Text>
            <Text color={theme.colors.textSecondary} variant="xs">
              {t('omr')}
            </Text>
            {product.originalPrice ? (
              <Text
                color={theme.colors.textMuted}
                latin
                style={styles.oldPrice}
                variant="sm"
              >
                {formatPrice(product.originalPrice.toDecimal())}
              </Text>
            ) : null}
          </View>

          <View
            style={[styles.rule, { backgroundColor: theme.colors.border }]}
          />

          {detail.data?.requiresVariantChoice ? (
            <VariantSelector
              variants={product.variants}
              selectedId={variant?.id ?? null}
              onSelect={setSelectedVariantId}
            />
          ) : null}

          {seller.data ? (
            <SellerStrip
              seller={seller.data}
              onOpen={() => onOpenSeller(seller.data.id)}
            />
          ) : null}

          <View
            style={[
              styles.promise,
              { backgroundColor: theme.colors.background, borderRadius: 14 },
            ]}
          >
            <View style={styles.promiseRow}>
              <Icon
                name="truck"
                color={theme.colors.accent}
                size={theme.iconSizes.sm}
              />
              <Text variant="xs">{t('deliveryLine')}</Text>
            </View>
            <View style={styles.promiseRow}>
              <Icon
                name="shield"
                color={theme.colors.accent}
                size={theme.iconSizes.sm}
              />
              <Text variant="xs">{t('returnsLine')}</Text>
            </View>
          </View>

          <ProductSpecs specs={product.specs} />

          {reviews.isError ? (
            <Text color={theme.colors.textMuted} variant="xs">
              {t('states:genericErrorBody')}
            </Text>
          ) : (
            <ProductReviews
              reviews={reviewItems}
              total={reviewTotal}
              locale={reviewLocale}
              hasMore={Boolean(reviews.hasNextPage)}
              isLoadingMore={reviews.isFetchingNextPage}
              onLoadMore={() => void reviews.fetchNextPage()}
            />
          )}

          {related.data && related.data.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text variant="sm" weight="extrabold">
                {t('alsoLike')}
              </Text>
              <ProductRail
                label={t('alsoLike')}
                products={related.data}
                wishlist={wishlist}
                onOpen={onOpenProduct}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BuyBar
        hint={addLabel}
        disabled={needsChoice || soldOut}
        onAddToCart={() => onAddedToCart(t('addedToCart'))}
        onBuyNow={onBuyNow}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: 7 },
  // `padding: 16px 18px 0` under the hero, with the prototype's 12 px stack gap.
  body: { gap: 12, paddingHorizontal: 18, paddingTop: 16 },
  loadingCopy: { gap: 12, padding: 18 },
  oldPrice: { textDecorationLine: 'line-through' },
  page: { paddingBottom: 24 },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 9 },
  promise: { gap: 10, padding: 13 },
  promiseRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  relatedSection: { gap: 9 },
  rule: { height: 1, marginVertical: 2 },
});
