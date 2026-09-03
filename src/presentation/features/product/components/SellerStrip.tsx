import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Seller } from '@domain/catalog';

import { Pressable, Text } from '@presentation/components/primitives';
import { Avatar } from '@presentation/components/surfaces';
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

/** `padding: 12px; border: 1px solid #E8E8EC; border-radius: 14px` seller row on the PDP. */
export function SellerStrip({
  seller,
  onOpen,
}: {
  seller: Seller;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={seller.storeName}
      onPress={onOpen}
      style={[
        styles.strip,
        { borderColor: theme.colors.border, borderRadius: 14 },
      ]}
    >
      <Avatar
        accessibilityLabel={seller.storeName}
        initials={storeInitials(seller.storeName)}
        size="md"
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
      <Text color={theme.colors.accent} variant="micro" weight="bold">
        {t('visitStore')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: 2 },
  strip: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 12,
  },
});
