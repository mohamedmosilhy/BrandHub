import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Seller } from '@domain/catalog';

import { Pressable, Text } from '@presentation/components/primitives';
import { formatCount } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

/** The prototype's "A2" tile: the first word when it is short, otherwise two word initials. */
export function storeInitials(storeName: string): string {
  const words = storeName.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  if (first.length <= 2) return first.toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * The store tile is a rounded square, not an avatar circle: `width: 38px; height: 38px;
 * border-radius: 10px; background: #EEEDF9` with `14px/800` accent initials, inside a `padding:
 * 12px; gap: 11px; border-radius: 14px` bordered row.
 */
export function StoreTile({
  storeName,
  size,
  radius,
  textVariant,
}: {
  storeName: string;
  size: number;
  radius: number;
  textVariant: 'sm' | 'h2';
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="image"
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.accentLight,
          borderRadius: radius,
          height: size,
          width: size,
        },
      ]}
    >
      <Text
        color={theme.colors.accentHover}
        latin
        variant={textVariant}
        weight="extrabold"
      >
        {storeInitials(storeName)}
      </Text>
    </View>
  );
}

export function SellerStrip({
  seller,
  onOpen,
}: {
  seller: Seller;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const pdp = theme.mobile.pdp;
  return (
    <Pressable
      accessibilityLabel={seller.storeName}
      onPress={onOpen}
      style={[
        styles.strip,
        {
          borderColor: theme.colors.border,
          borderRadius: 14,
          gap: pdp.sellerGap,
          padding: pdp.sellerPadding,
        },
      ]}
    >
      <StoreTile
        storeName={seller.storeName}
        size={pdp.sellerTileSize}
        radius={pdp.sellerTileRadius}
        textVariant="sm"
      />
      <View style={styles.copy}>
        <Text variant="xs" weight="bold">
          {seller.storeName}
        </Text>
        <Text color={theme.colors.textMuted} variant="micro">
          {seller.verified ? `${t('verifiedSeller')} · ` : ''}
          {t('ratingValue', { value: seller.rating.toFixed(1) })} ·{' '}
          {t('salesCount', { count: formatCount(seller.salesCount) })}
        </Text>
      </View>
      <Text color={theme.colors.accentHover} variant="xxs" weight="bold">
        {t('visitStore')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: 2 },
  strip: { alignItems: 'center', borderWidth: 1, flexDirection: 'row' },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
