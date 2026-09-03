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

import { Icon, Image, Pressable } from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { useTheme } from '@presentation/theme';

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
  const pdp = theme.mobile.pdp;
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
          <View
            key={image?.id ?? index}
            style={{ height: pdp.heroHeight, width }}
          >
            <Image
              accessibilityLabel={image?.alt || product.title}
              contentFit="contain"
              source={productArtworkSource(image?.url, product.id)}
              style={styles.image}
            />
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.actions,
          { insetInlineStart: pdp.actionInset, top: pdp.actionTop },
        ]}
      >
        <Pressable
          accessibilityLabel={t('back')}
          compact
          compactSize={pdp.actionSize}
          onPress={onBack}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon name="arrow-back" size={pdp.backIconSize} />
        </Pressable>
      </View>
      <View
        style={[
          styles.actions,
          { insetInlineEnd: pdp.actionInset, top: pdp.actionTop },
        ]}
      >
        <Pressable
          accessibilityLabel={saved ? t('removeFromWishlist') : t('wishlist')}
          accessibilityState={{ selected: saved }}
          compact
          compactSize={pdp.actionSize}
          onPress={onToggleWishlist}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon
            name="heart"
            color={saved ? theme.colors.pink : theme.colors.textPrimary}
            filled={saved}
            size={pdp.actionIconSize}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={t('cart')}
          compact
          compactSize={pdp.actionSize}
          onPress={onCart}
          style={[styles.action, { borderRadius: theme.radius.full }]}
        >
          <Icon name="cart" size={pdp.actionIconSize} />
        </Pressable>
      </View>

      {/*
        The prototype's pager is dots alone. They carry no text, so the count is attached to the
        row as its accessibility label rather than printed over the artwork.
      */}
      {images.length > 1 ? (
        <View
          accessibilityLabel={t('imageOf', {
            index: active + 1,
            count: images.length,
          })}
          style={[styles.dots, { bottom: pdp.dotsBottom }]}
        >
          {images.map((image, index) => (
            <View
              key={image?.id ?? index}
              style={{
                backgroundColor:
                  index === active ? theme.colors.ink : theme.colors.ink40,
                borderRadius: theme.radius.full,
                height: pdp.dotSize,
                width: index === active ? pdp.dotActiveWidth : pdp.dotSize,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 8, position: 'absolute', zIndex: 3 },
  dots: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
  },
  hero: { position: 'relative' },
  image: { height: '100%', width: '100%' },
});
