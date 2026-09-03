import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@presentation/components/controls';
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
import { toneAt, useTheme } from '@presentation/theme';

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
        <Text variant="h3" weight="extrabold">
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
                style={[styles.imageShell, { backgroundColor: toneAt(index) }]}
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
                  compactSize={30}
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
                <Text latin variant="body" weight="extrabold">
                  {formatPrice(item.product.price.toDecimal())}
                </Text>
                <Button
                  fullWidth
                  label={t('addToCart')}
                  size="sm"
                  style={styles.add}
                  variant="secondary"
                  onPress={() => onAddToCart?.(item.productId)}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** `height: 34px; border-radius: 99px` pill action under the price. */
  add: { height: 34 },
  cell: {
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    overflow: 'hidden',
  },
  copy: { gap: 7, paddingBottom: 12, paddingHorizontal: 11, paddingTop: 9 },
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
  imageShell: { height: 118 },
  loading: { flexDirection: 'row', gap: 12, padding: 16 },
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    insetInlineEnd: 8,
    top: 8,
    zIndex: 1,
  },
  title: { height: 32, lineHeight: 16 },
});
