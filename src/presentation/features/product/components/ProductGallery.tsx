import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { Product } from '@domain/catalog';

import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { useTheme } from '@presentation/theme';

const HERO_HEIGHT = 300;

/**
 * `design-reference/BRANDHUB App.dc.html`: the hero sits on the product's tone with a 36 px
 * circular back control at `top: 12px; inset-inline-start: 14px`, wishlist and cart at the
 * matching end inset, and the dot row `bottom: 14px` — an 18x5 pill for the active image and
 * 5x5 dots for the rest.
 */
export function ProductGallery({
  product,
  tone,
  saved,
  onBack,
  onToggleWishlist,
  onCart,
}: {
  product: Product;
  tone: string;
  saved: boolean;
  onBack: () => void;
  onToggleWishlist: () => void;
  onCart: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const images = product.images.length > 0 ? product.images : [null];

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    setActive(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.hero, { backgroundColor: tone }]} onLayout={onLayout}>
      <ScrollView
        accessibilityLabel={t('productImages', { count: images.length })}
        horizontal
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {images.map((image, index) => (
          <View key={image?.id ?? index} style={{ height: HERO_HEIGHT, width }}>
            <Image
              accessibilityLabel={image?.alt || product.title}
              contentFit="contain"
              source={productArtworkSource(image?.url, product.id)}
              style={styles.image}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.actions, styles.leading]}>
        <Pressable
          accessibilityLabel={t('back')}
          compact
          compactSize={36}
          onPress={onBack}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon name="arrow-back" size={theme.iconSizes.sm} />
        </Pressable>
      </View>
      <View style={[styles.actions, styles.trailing]}>
        <Pressable
          accessibilityLabel={saved ? t('removeFromWishlist') : t('wishlist')}
          accessibilityState={{ selected: saved }}
          compact
          compactSize={36}
          onPress={onToggleWishlist}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon
            name="heart"
            color={saved ? theme.colors.pink : theme.colors.textPrimary}
            filled={saved}
            size={theme.iconSizes.sm}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={t('cart')}
          compact
          compactSize={36}
          onPress={onCart}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon name="cart" size={theme.iconSizes.sm} />
        </Pressable>
      </View>

      {images.length > 1 ? (
        <View
          accessibilityLabel={t('imageOf', {
            index: active + 1,
            count: images.length,
          })}
          style={styles.dots}
        >
          {images.map((image, index) => (
            <View
              key={image?.id ?? index}
              style={{
                backgroundColor:
                  index === active ? theme.colors.ink : theme.colors.ink40,
                borderRadius: theme.radius.full,
                height: 5,
                width: index === active ? 18 : 5,
              }}
            />
          ))}
        </View>
      ) : null}
      {/* The count is text so screen readers and tests can read the pager, not just see it. */}
      <Text
        accessibilityLabel={t('imageOf', {
          index: active + 1,
          count: images.length,
        })}
        color={theme.colors.textSecondary}
        latin
        style={styles.counter}
        variant="micro"
        weight="semibold"
      >
        {active + 1}/{images.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 12,
    zIndex: 3,
  },
  counter: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 99,
    bottom: 12,
    insetInlineEnd: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    position: 'absolute',
  },
  dots: {
    alignSelf: 'center',
    bottom: 14,
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
  },
  hero: { position: 'relative' },
  image: { height: '100%', width: '100%' },
  leading: { insetInlineStart: 14 },
  trailing: { insetInlineEnd: 14 },
});
