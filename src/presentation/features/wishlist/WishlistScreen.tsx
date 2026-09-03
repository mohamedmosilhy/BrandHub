import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { formatPrice } from '@presentation/formatting';
import { mobile, toneAt, useTheme } from '@presentation/theme';

import { useWishlistContext } from './WishlistProvider';

/**
 * The prototype's wishlist is its own two-column grid, not a `ProductCard` variant: the card
 * carries a filled remove heart over the image and a full-width add-to-cart button under the
 * price, and neither exists on any other card. `design-reference/BRANDHUB App.dc.html`:
 * `border-radius: 16px` cell, `padding: 9px 11px 12px` copy, a `34px` pill action.
 */
export function WishlistScreen({
  onBack,
  onOpenProduct,
  onDiscover,
  onAddToCart,
}: {
  onBack: () => void;
  onOpenProduct: (id: string) => void;
  onDiscover: () => void;
  onAddToCart?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.wishlist;
  const wishlist = useWishlistContext();
  const items = wishlist?.items ?? [];

  return (
    <Screen
      accessibilityLabel={t('wishlist')}
      background={theme.colors.background}
      edgeToEdge
      gap={0}
      scroll={false}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable accessibilityLabel={t('back')} compact onPress={onBack}>
          <Icon name="arrow-back" size={theme.iconSizes.md} />
        </Pressable>
        {/* `font-size: 15px; font-weight: 800`. */}
        <Text variant="bodyLg" weight="extrabold">
          {t('wishlist')}
        </Text>
        <Text color={theme.colors.textMuted} style={styles.count} variant="xs">
          {items.length} {t('items')}
        </Text>
      </View>

      {wishlist?.isPending ? (
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
      ) : wishlist?.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => wishlist.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('emptyWish')}
          body={t('emptyWishBody')}
          actionLabel={t('discover')}
          icon="heart"
          onAction={onDiscover}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((item, index) => (
            <View
              key={item.productId}
              style={[
                styles.cell,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Pressable
                accessibilityLabel={item.product.title}
                onPress={() => onOpenProduct(item.productId)}
                style={[
                  styles.imageShell,
                  {
                    backgroundColor: toneAt(index),
                    height: geometry.imageHeight,
                  },
                ]}
              >
                <Image
                  accessibilityLabel={item.product.title}
                  contentFit="contain"
                  source={productArtworkSource(
                    item.product.images[0]?.url,
                    item.productId,
                  )}
                  style={styles.image}
                />
                <Pressable
                  accessibilityLabel={t('removeFromWishlist')}
                  compact
                  compactSize={geometry.removeSize}
                  onPress={() => wishlist?.toggle(item.product)}
                  style={[
                    styles.remove,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                >
                  <Icon
                    name="heart"
                    color={theme.colors.pink}
                    filled
                    size={theme.iconSizes.sm}
                  />
                </Pressable>
              </Pressable>
              <View style={styles.copy}>
                <Text numberOfLines={2} style={styles.title} variant="xxs">
                  {item.product.title}
                </Text>
                {/* `font-size: 13.5px; font-weight: 800`. */}
                <Text latin variant="price" weight="extrabold">
                  {formatPrice(item.product.price.toDecimal())}
                </Text>
                {/*
                  `height: 34px; border-radius: 99px; background: #EEEDF9; color: #7F77DD` —
                  a tinted pill, not one of the bordered button variants.
                */}
                <Pressable
                  accessibilityLabel={t('addToCart')}
                  onPress={() => onAddToCart?.(item.productId)}
                  style={[
                    styles.add,
                    {
                      backgroundColor: theme.colors.accentLight,
                      borderRadius: theme.radius.full,
                      height: geometry.actionHeight,
                    },
                  ]}
                >
                  <Text
                    color={theme.colors.accentHover}
                    variant="xs"
                    weight="bold"
                  >
                    {t('addToCart')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: { alignItems: 'center', justifyContent: 'center' },
  cell: {
    borderRadius: mobile.wishlist.cellRadius,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    overflow: 'hidden',
  },
  copy: {
    gap: 7,
    paddingBottom: mobile.wishlist.copyPaddingBottom,
    paddingHorizontal: mobile.wishlist.copyPaddingX,
    paddingTop: mobile.wishlist.copyPaddingTop,
  },
  count: { marginInlineStart: 'auto' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  // `padding: 12px 16px; border-bottom: 1px solid #E8E8EC`.
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: { height: '100%', width: '100%' },
  imageShell: {},
  loading: { flexDirection: 'row', gap: 12, padding: 16 },
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    insetInlineEnd: 8,
    top: 8,
    zIndex: 1,
  },
  // `line-height: 1.55; height: 3.1em` — exactly two lines, so a row keeps one baseline.
  title: { height: 33, lineHeight: 16 },
});
