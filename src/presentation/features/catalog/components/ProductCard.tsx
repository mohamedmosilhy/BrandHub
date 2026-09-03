import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { discountPercent, type Product } from '@domain/catalog';

import {
  Icon,
  Image,
  Pressable,
  Text,
  type TextVariant,
} from '@presentation/components/primitives';
import { formatPrice } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

import { productArtworkSource } from './mockArtwork';

/**
 * The prototype draws the same product four ways and none of the four share a radius, an image
 * height or a type size. Each row below is measured off `design-reference/BRANDHUB App.dc.html`:
 *
 * - `deal`   — home "Today's deals" grid: radius 18, 132 px image, 11 px title, 14.5 px price.
 * - `grid`   — category screen grid: radius 16, 104 px image, 10.5 px title, 13 px price.
 * - `compact`— browse pane grid: radius 14, 96 px image, 10 px title, 12.5 px price.
 * - `list`   — search result row: radius 14, 68 px thumbnail, 11.5 px title, 13.5 px price.
 *
 * None of them carries a rating; the prototype shows ratings on the PDP only. `showRating`
 * exists for that screen rather than being on by default here.
 */
export type ProductCardVariant = 'deal' | 'rail' | 'grid' | 'list' | 'compact';

type Metrics = {
  radius: number;
  image: number;
  thumbRadius?: number;
  title: TextVariant;
  price: TextVariant;
  titleLineHeight: number;
  showUnit: boolean;
  padTop: number;
  padX: number;
  padBottom: number;
  gap: number;
};

const METRICS: Record<ProductCardVariant, Metrics> = {
  deal: {
    radius: 18,
    image: 132,
    title: 'xs',
    price: 'priceLg',
    titleLineHeight: 17,
    showUnit: true,
    padTop: 9,
    padX: 11,
    padBottom: 12,
    gap: 5,
  },
  rail: {
    radius: 18,
    image: 132,
    title: 'xs',
    price: 'priceLg',
    titleLineHeight: 17,
    showUnit: true,
    padTop: 9,
    padX: 11,
    padBottom: 12,
    gap: 5,
  },
  grid: {
    radius: 16,
    image: 104,
    title: 'xxs',
    price: 'body',
    titleLineHeight: 17,
    showUnit: false,
    padTop: 9,
    padX: 10,
    padBottom: 11,
    gap: 4,
  },
  compact: {
    radius: 14,
    image: 96,
    title: 'micro',
    price: 'sm',
    titleLineHeight: 15,
    showUnit: false,
    padTop: 8,
    padX: 9,
    padBottom: 10,
    gap: 4,
  },
  list: {
    radius: 14,
    image: 68,
    thumbRadius: 11,
    title: 'xs',
    price: 'price',
    titleLineHeight: 18,
    showUnit: true,
    padTop: 0,
    padX: 0,
    padBottom: 0,
    gap: 5,
  },
};

const GEOMETRY: Record<ProductCardVariant, ViewStyle> = {
  deal: { flex: 1 },
  rail: { width: 158 },
  grid: { flex: 1 },
  compact: { flex: 1 },
  list: { width: '100%' },
};

export type ProductCardProps = {
  product: Product;
  variant?: ProductCardVariant;
  /** The prototype's index-based tint behind the cut-out photo; see `theme.tones`. */
  tone?: string;
  express?: boolean;
  showRating?: boolean;
  /** Renders the heart filled and labels it as a removal; see `useWishlistCardProps`. */
  saved?: boolean;
  onOpen: () => void;
  onPrefetch?: () => void;
  onWishlist?: () => void;
  onAdd?: () => void;
};

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'grid',
  tone,
  express = false,
  showRating = false,
  saved = false,
  onOpen,
  onPrefetch,
  onWishlist,
  onAdd,
}: ProductCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const discount = discountPercent(product);
  const horizontal = variant === 'list';
  const metrics = METRICS[variant];
  const image = product.images[0];
  const imageSource = productArtworkSource(image?.url, product.id);
  const background = tone ?? theme.colors.accentLight;
  // The prototype clamps every card title to exactly two lines so a row of cards keeps one
  // baseline; `numberOfLines` alone lets a one-line title shorten the card.
  const titleLine = metrics.titleLineHeight;

  return (
    <Pressable
      accessibilityLabel={product.title}
      onPress={onOpen}
      onPressIn={onPrefetch}
      style={[
        styles.card,
        GEOMETRY[variant],
        horizontal && styles.horizontal,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: metrics.radius,
        },
      ]}
    >
      <View
        style={[
          styles.imageShell,
          {
            backgroundColor: background,
            borderRadius: metrics.thumbRadius ?? 0,
            height: metrics.image,
            width: horizontal ? metrics.image : '100%',
          },
        ]}
      >
        {imageSource ? (
          <Image
            accessibilityLabel={image?.alt || product.title}
            source={imageSource}
            style={styles.image}
            contentFit="contain"
          />
        ) : null}
        {discount > 0 && !horizontal && variant !== 'compact' ? (
          <View
            style={[
              styles.discount,
              {
                backgroundColor: theme.colors.ink,
                borderRadius: theme.radius.full,
                insetInlineStart: 9,
                top: 9,
              },
            ]}
          >
            <Text
              color={theme.colors.textInverse}
              latin
              variant="micro"
              weight="bold"
            >
              -{discount}%
            </Text>
          </View>
        ) : null}
        {onWishlist ? (
          <Pressable
            accessibilityLabel={saved ? t('removeFromWishlist') : t('wishlist')}
            accessibilityState={{ selected: saved }}
            compact
            compactSize={theme.mobile.iconButtonSize}
            onPress={onWishlist}
            style={[
              styles.wishlist,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.full,
                insetInlineEnd: theme.spacing.x2,
                top: theme.spacing.x2,
              },
            ]}
          >
            <Icon
              name="heart"
              color={saved ? theme.colors.pink : theme.colors.textPrimary}
              filled={saved}
              size={theme.iconSizes.sm}
            />
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.copy,
          {
            gap: metrics.gap,
            paddingBottom: metrics.padBottom,
            paddingHorizontal: metrics.padX,
            paddingTop: metrics.padTop,
          },
        ]}
      >
        {express || showRating ? (
          <View style={styles.badges}>
            {express ? (
              <Text
                color={theme.colors.accentHover}
                variant="micro"
                weight="bold"
              >
                Hub Express
              </Text>
            ) : null}
            {showRating ? (
              <View style={styles.rating}>
                <Icon
                  name="star"
                  color={theme.colors.rating}
                  filled
                  size={theme.iconSizes.xs}
                />
                <Text latin variant="micro" weight="semibold">
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={{ height: titleLine * 2, lineHeight: titleLine }}
          variant={metrics.title}
        >
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text latin variant={metrics.price} weight="extrabold">
            {formatPrice(product.price.toDecimal())}
          </Text>
          {metrics.showUnit ? (
            <Text color={theme.colors.textSecondary} variant="micro">
              {t('omr')}
            </Text>
          ) : null}
          {product.originalPrice && variant !== 'compact' ? (
            <Text
              color={theme.colors.textMuted}
              latin
              style={styles.oldPrice}
              variant="micro"
            >
              {formatPrice(product.originalPrice.toDecimal())}
            </Text>
          ) : null}
          {onAdd ? (
            <Pressable
              accessibilityLabel={t('addToCart')}
              compact
              compactSize={theme.mobile.iconButtonSize}
              onPress={onAdd}
              style={[
                styles.add,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: theme.radius.full,
                },
              ]}
            >
              <Icon
                name="plus"
                color={theme.colors.textInverse}
                size={theme.iconSizes.sm}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    marginInlineStart: 'auto',
  },
  badges: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  card: { borderWidth: 1, overflow: 'hidden' },
  copy: { flex: 1 },
  discount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    zIndex: 1,
  },
  // The search row is `display: flex; gap: 12px; padding: 8px` around a 68 px thumbnail.
  horizontal: { flexDirection: 'row', gap: 12, padding: 8 },
  image: { height: '100%', width: '100%' },
  imageShell: { flexShrink: 0, overflow: 'hidden' },
  oldPrice: { textDecorationLine: 'line-through' },
  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 5 },
  rating: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  wishlist: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
});
