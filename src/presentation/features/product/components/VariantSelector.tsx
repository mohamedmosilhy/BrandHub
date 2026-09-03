import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { ProductVariant } from '@domain/catalog';

import { Pressable, Text } from '@presentation/components/primitives';
import { colors, useTheme } from '@presentation/theme';

/**
 * D8's addition to the reference, drawn in the reference's own shape. The prototype shows four
 * `34px` circular swatches with the selected one ringed `0 0 0 2px #fff, 0 0 0 4px #7F77DD`; they
 * carry no id, which is exactly why D8 exists. These do: each swatch is a real variant, labelled
 * with the attribute value for screen readers.
 *
 * A variant whose attributes are not a colour the prototype paints falls back to a labelled chip,
 * so nothing is silently drawn in the wrong hue.
 */
const SWATCHES: Readonly<Record<string, string>> = {
  black: colors.ink,
  white: colors.white,
  sand: colors.sand,
  beige: colors.sand,
  grey: colors.border,
  gray: colors.border,
  silver: colors.border,
  purple: colors.accent,
  violet: colors.accent,
  pink: colors.pink,
  gold: colors.gold,
};

function swatchColor(variant: ProductVariant): string | null {
  for (const value of Object.values(variant.attributes)) {
    const match = SWATCHES[value.trim().toLowerCase()];
    if (match) return match;
  }
  return null;
}

function variantLabel(variant: ProductVariant): string {
  return Object.values(variant.attributes).join(' · ') || variant.sku;
}

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
  const pdp = theme.mobile.pdp;

  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      <Text variant="xs" weight="bold">
        {t('colour')}
      </Text>
      <View style={styles.options}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const soldOut = variant.stock <= 0;
          const swatch = swatchColor(variant);
          const ring = selected
            ? {
                borderColor: theme.colors.accent,
                borderWidth: pdp.swatchRingWidth,
                padding: pdp.swatchRingGap,
              }
            : {
                borderColor: theme.colors.transparent,
                borderWidth: pdp.swatchRingWidth,
                padding: pdp.swatchRingGap,
              };

          return (
            <Pressable
              key={variant.id}
              accessibilityLabel={variantLabel(variant)}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: soldOut }}
              compact
              disabled={soldOut}
              onPress={() => onSelect(variant.id)}
              style={[
                swatch ? styles.swatchShell : styles.chipShell,
                { borderRadius: theme.radius.full, opacity: soldOut ? 0.4 : 1 },
                ring,
              ]}
            >
              {swatch ? (
                <View
                  style={{
                    backgroundColor: swatch,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.full,
                    borderWidth: 1,
                    height: pdp.swatchSize,
                    width: pdp.swatchSize,
                  }}
                />
              ) : (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.colors.accentLight
                        : theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.full,
                      minHeight: pdp.swatchSize,
                    },
                  ]}
                >
                  <Text
                    color={
                      selected
                        ? theme.colors.accentHover
                        : theme.colors.textPrimary
                    }
                    variant="xs"
                    weight="semibold"
                  >
                    {variantLabel(variant)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  chipShell: {},
  group: { gap: 9 },
  options: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  swatchShell: {},
});
