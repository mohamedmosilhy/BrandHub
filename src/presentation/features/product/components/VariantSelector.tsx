import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { ProductVariant } from '@domain/catalog';

import { Pressable, Text } from '@presentation/components/primitives';
import { formatPrice } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

/**
 * D8's addition to the reference. The prototype drew four decorative colour dots that carried no
 * id; `POST /cart/items` needs one, so the dots become real options labelled with the attribute
 * the seed actually varies. Rendering the label rather than a colour swatch keeps it honest —
 * the API sends attribute names, not hex values.
 */
export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: readonly ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const label = (variant: ProductVariant) =>
    Object.values(variant.attributes).join(' · ') || variant.sku;

  return (
    <View style={styles.group}>
      <Text variant="xs" weight="bold">
        {t('colour')}
      </Text>
      <View style={styles.options}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const soldOut = variant.stock <= 0;
          return (
            <Pressable
              key={variant.id}
              accessibilityLabel={label(variant)}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: soldOut }}
              disabled={soldOut}
              onPress={() => onSelect(variant.id)}
              style={[
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.colors.accentLight
                    : theme.colors.surface,
                  borderColor: selected
                    ? theme.colors.accent
                    : theme.colors.border,
                  borderRadius: theme.radius.md,
                  opacity: soldOut ? 0.45 : 1,
                },
              ]}
            >
              <Text
                color={
                  selected ? theme.colors.accent : theme.colors.textPrimary
                }
                variant="xs"
                weight="semibold"
              >
                {label(variant)}
              </Text>
              <Text color={theme.colors.textMuted} latin variant="micro">
                {formatPrice(variant.price.toDecimal())}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 9 },
  option: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
});
