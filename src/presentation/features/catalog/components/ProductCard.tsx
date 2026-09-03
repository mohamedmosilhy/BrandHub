import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { discountPercent, type Product } from '@domain/catalog';

import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { formatPrice } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

export type ProductCardVariant = 'rail' | 'grid' | 'list' | 'compact';

export type ProductCardProps = {
  product: Product;
  variant?: ProductCardVariant;
  express?: boolean;
  onOpen: () => void;
  onPrefetch?: () => void;
  onWishlist?: () => void;
  onAdd?: () => void;
};

const geometry: Record<ProductCardVariant, ViewStyle> = {
  rail: { width: 158 },
  grid: { flex: 1 },
  list: { width: '100%' },
  compact: { width: 122 },
};

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'grid',
  express = false,
  onOpen,
  onPrefetch,
  onWishlist,
  onAdd,
}: ProductCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const discount = discountPercent(product);
  const horizontal = variant === 'list';
  const compact = variant === 'compact';
  const imageSize = horizontal
    ? 78
    : compact
      ? 92
      : variant === 'rail'
        ? 132
        : 142;
  const image = product.images[0];

  return (
    <Pressable
      accessibilityLabel={product.title}
      onPress={onOpen}
      onPressIn={onPrefetch}
      style={[
        styles.card,
        geometry[variant],
        horizontal && styles.horizontal,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.imageShell,
          {
            backgroundColor: theme.colors.accentLight,
            borderRadius: horizontal ? theme.radius.md : 0,
            height: imageSize,
            width: horizontal ? imageSize : '100%',
          },
        ]}
      >
        {image ? (
          <Image
            accessibilityLabel={image.alt || product.title}
            source={{ uri: image.url }}
            style={styles.image}
            contentFit="contain"
          />
        ) : null}
        {discount > 0 ? (
          <View
            style={[
              styles.discount,
              {
                backgroundColor: theme.colors.ink,
                borderRadius: theme.radius.full,
                insetInlineStart: theme.spacing.x2,
                top: theme.spacing.x2,
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
            accessibilityLabel={t('wishlist')}
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
            <Icon name="heart" size={theme.iconSizes.sm} />
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.copy,
          {
            gap: theme.mobile.gapMicro,
            padding: compact ? theme.spacing.x2 : theme.mobile.gapItem,
          },
        ]}
      >
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
        </View>
        <Text numberOfLines={2} variant={compact ? 'xxs' : 'xs'}>
          {product.title}
        </Text>
        <View style={styles.priceRow}>
          <Text latin variant={compact ? 'xs' : 'sm'} weight="extrabold">
            {formatPrice(product.price.toDecimal())}
          </Text>
          <Text color={theme.colors.textSecondary} variant="micro">
            {t('omr')}
          </Text>
          {product.originalPrice ? (
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
  horizontal: { flexDirection: 'row', padding: 8 },
  image: { height: '100%', width: '100%' },
  imageShell: { overflow: 'hidden' },
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
