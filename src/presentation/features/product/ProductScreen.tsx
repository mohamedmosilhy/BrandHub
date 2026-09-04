import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  discountPercent,
  isInStock,
  resolveVariant,
  type GetProductDetailUseCase,
  type GetRelatedProductsUseCase,
  type Product,
  type ProductVariant,
  type ReviewRepository,
  type SellerRepository,
} from '@domain/catalog';

import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Text } from '@presentation/components/primitives';
import { useWishlistCardProps } from '@presentation/features/wishlist';
import { formatPrice } from '@presentation/formatting';
import { mobile, toneAt, useTheme } from '@presentation/theme';

import {
  BuyBar,
  ProductBadges,
  ProductGallery,
  ProductReviews,
  ProductSpecs,
  RelatedRail,
  SellerStrip,
  VariantSelector,
  type ProductBadge,
} from './components';
import {
  useProductDetail,
  useProductReviews,
  useRelatedProducts,
  useSeller,
} from './useProductQueries';

/**
 * `TONES[PRODUCTS.indexOf(p) % TONES.length]` in the prototype: the hero takes the product's tint
 * from its position in the catalogue, which this screen does not have. The id is folded into the
 * same five-step rotation instead — stable per product, and spread across all five tones, which
 * indexing by id length was not.
 */
function productTone(productId: string): string {
  return toneAt(
    [...productId].reduce((sum, char) => sum + char.charCodeAt(0), 0),
  );
}

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
  onAddedToCart: (product: Product, variant: ProductVariant) => void;
  onBuyNow: (product: Product, variant: ProductVariant) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const pdp = theme.mobile.pdp;
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

  const badges: ProductBadge[] = [
    ...(discount > 0
      ? [
          {
            label: t('discountLabel', { percent: discount }),
            tone: 'pink' as const,
          },
        ]
      : []),
    ...(soldOut ? [{ label: t('outOfStock'), tone: 'neutral' as const }] : []),
  ];

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
          tone={productTone(product.id)}
          saved={wishlist.savedIds.has(product.id)}
          onBack={onBack}
          onCart={onCart}
          onToggleWishlist={() => wishlist.onWishlist?.(product)}
        />

        <View style={styles.body}>
          {/* D21 holds Express back until the API carries it; the discount pill is derived. */}
          <ProductBadges badges={badges} />

          {/* `font-size: 15px; font-weight: 700; line-height: 1.7`. */}
          <Text style={styles.title} variant="bodyLg" weight="bold">
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
            <Text color={theme.colors.textMuted} variant="xxs">
              ({reviewTotal} {t('reviewsWord')})
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text latin variant="priceHero" weight="extrabold">
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
                variant="body"
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
              {
                backgroundColor: theme.colors.background,
                borderRadius: 14,
                gap: pdp.promiseGap,
                padding: pdp.promisePadding,
              },
            ]}
          >
            <View style={styles.promiseRow}>
              <Icon
                name="truck"
                color={theme.colors.accent}
                size={pdp.promiseIconSize}
              />
              <Text variant="xs">{t('deliveryLine')}</Text>
            </View>
            <View style={styles.promiseRow}>
              <Icon
                name="shield"
                color={theme.colors.accent}
                size={pdp.promiseIconSize}
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
              {/* `font-size: 12.5px; font-weight: 800; margin-top: 6px`. */}
              <Text
                style={styles.relatedHeading}
                variant="sm"
                weight="extrabold"
              >
                {t('alsoLike')}
              </Text>
              <RelatedRail
                label={t('alsoLike')}
                products={related.data}
                onOpen={onOpenProduct}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BuyBar
        hint={addLabel}
        disabled={needsChoice || soldOut}
        onAddToCart={() => {
          if (variant) onAddedToCart(product, variant);
        }}
        onBuyNow={() => {
          if (variant) onBuyNow(product, variant);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // `padding: 16px 18px 0` under the hero, with the prototype's 12 px stack gap.
  body: {
    gap: mobile.pdp.bodyGap,
    paddingHorizontal: mobile.pdp.bodyPaddingX,
    paddingTop: mobile.pdp.bodyPaddingTop,
  },
  loadingCopy: { gap: 12, padding: mobile.pdp.bodyPaddingX },
  oldPrice: { textDecorationLine: 'line-through' },
  page: { paddingBottom: 24 },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 9 },
  promise: {},
  promiseRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  relatedHeading: { marginTop: 6 },
  relatedSection: { gap: 9 },
  rule: { height: 1, marginVertical: 2 },
  title: { lineHeight: 26 },
});
