import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Product } from '@domain/catalog';
import type { ShoppablePost } from '@domain/social';

import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog';
import { formatCount, formatPrice } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

/**
 * `design-reference/BRANDHUB App.dc.html`, element by element: a 232 px cover, a like and comment
 * row at `11px 14px 6px`, the caption on a 1.7 leading, and the tagged-product card — a 46 px
 * thumbnail, the title, the price, and a 34 px circular cart action — inside an accent-tinted
 * panel that opens the PDP.
 */
export function ShoppablePostCard({
  post,
  onOpenProduct,
}: {
  post: ShoppablePost;
  onOpenProduct: (productId: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.influencer;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.colors.border,
          borderRadius: geometry.postRadius,
        },
      ]}
    >
      <Image
        accessibilityLabel={post.caption}
        contentFit="cover"
        source={productArtworkSource(
          post.imageUrl ?? undefined,
          post.products[0]?.id ?? post.id,
        )}
        style={{ height: geometry.postImageHeight }}
      />
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Icon name="heart" size={geometry.postLikeIconSize} />
          <Text latin variant="xs" weight="bold">
            {formatCount(post.likes)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="chat" size={geometry.postCommentIconSize} />
          <Text latin variant="xs" weight="bold">
            {formatCount(post.comments)}
          </Text>
        </View>
      </View>
      <View style={styles.caption}>
        <Text color={theme.colors.textSecondary} variant="xs">
          {post.caption}
        </Text>
      </View>
      {post.products.map((product) => (
        <TaggedProduct
          key={product.id}
          label={t('viewProduct')}
          product={product}
          onPress={() => onOpenProduct(product.id)}
        />
      ))}
    </View>
  );
}

function TaggedProduct({
  product,
  label,
  onPress,
}: {
  product: Product;
  label: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.influencer;
  return (
    <Pressable
      accessibilityLabel={`${label} — ${product.title}`}
      onPress={onPress}
      style={[
        styles.tagged,
        {
          backgroundColor: theme.colors.accentLight,
          borderRadius: geometry.taggedRadius,
          padding: geometry.taggedPadding,
        },
      ]}
    >
      <Image
        accessibilityLabel={product.title}
        contentFit="contain"
        source={productArtworkSource(product.images[0]?.url, product.id)}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: geometry.taggedThumbRadius,
          height: geometry.taggedThumbSize,
          width: geometry.taggedThumbSize,
        }}
      />
      <View style={styles.taggedCopy}>
        <Text numberOfLines={1} variant="xxs" weight="semibold">
          {product.title}
        </Text>
        <Text latin variant="sm" weight="extrabold">
          {`${formatPrice(product.price.toDecimal())} ${t('omr')}`}
        </Text>
      </View>
      <View
        style={[
          styles.taggedAction,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Icon
          name="cart"
          color={theme.colors.textInverse}
          size={geometry.taggedActionIconSize}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caption: {
    paddingBottom: mobile.influencer.postCaptionPaddingBottom,
    paddingHorizontal: mobile.influencer.postMetaPaddingX,
  },
  card: { borderWidth: 1, overflow: 'hidden' },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobile.influencer.postMetaGap,
    paddingBottom: mobile.influencer.postMetaPaddingBottom,
    paddingHorizontal: mobile.influencer.postMetaPaddingX,
    paddingTop: mobile.influencer.postMetaPaddingTop,
  },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  tagged: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobile.influencer.taggedGap,
    marginBottom: mobile.influencer.taggedMargin,
    marginHorizontal: mobile.influencer.taggedMargin,
    marginTop: mobile.influencer.taggedMarginTop,
  },
  taggedAction: {
    alignItems: 'center',
    height: mobile.influencer.taggedActionSize,
    justifyContent: 'center',
    width: mobile.influencer.taggedActionSize,
  },
  taggedCopy: { flex: 1, gap: 2, minWidth: 0 },
});
