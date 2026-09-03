import { StyleSheet, View } from 'react-native';

import type { Product } from '@domain/catalog';

import { HorizontalRail } from '@presentation/components/layout';
import { Image, Pressable, Text } from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { formatPrice } from '@presentation/formatting';
import { toneAt, useTheme } from '@presentation/theme';

/**
 * The PDP's related card is its own geometry and smaller than every catalogue card:
 * `width: 122px; border-radius: 14px` with a `9.5px` two-line title and a `12px/800` price, and
 * no rating, discount badge, unit label or heart. Reusing `ProductCard`'s `rail` variant would
 * put a 158 px card with an 18 px radius here, which is the home deals rail, not this.
 */
export function RelatedRail({
  products,
  label,
  onOpen,
  onPrefetch,
}: {
  products: readonly Product[];
  label: string;
  onOpen: (id: string) => void;
  onPrefetch?: (id: string) => void;
}) {
  const { theme } = useTheme();
  const pdp = theme.mobile.pdp;
  return (
    <HorizontalRail accessibilityLabel={label} gap={pdp.relatedGap}>
      {products.map((product, index) => (
        <Pressable
          key={product.id}
          accessibilityLabel={product.title}
          onPress={() => onOpen(product.id)}
          onPressIn={() => onPrefetch?.(product.id)}
          style={[
            styles.card,
            {
              borderColor: theme.colors.border,
              borderRadius: pdp.relatedRadius,
              width: pdp.relatedWidth,
            },
          ]}
        >
          <View style={{ backgroundColor: toneAt(index) }}>
            <Image
              accessibilityLabel={product.images[0]?.alt || product.title}
              contentFit="contain"
              source={productArtworkSource(product.images[0]?.url, product.id)}
              style={{ height: pdp.relatedImageHeight, width: '100%' }}
            />
          </View>
          <View style={styles.copy}>
            <Text
              color={theme.colors.textSecondary}
              numberOfLines={2}
              style={styles.title}
              variant="nano"
            >
              {product.title}
            </Text>
            <Text latin variant="sm" weight="extrabold">
              {formatPrice(product.price.toDecimal())}
            </Text>
          </View>
        </Pressable>
      ))}
    </HorizontalRail>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  // `padding: 8px 9px 10px; gap: 4px`.
  copy: { gap: 4, paddingBottom: 10, paddingHorizontal: 9, paddingTop: 8 },
  // `line-height: 1.5; height: 2.9em` — exactly two lines, so a row keeps one baseline.
  title: { height: 29, lineHeight: 14 },
});
