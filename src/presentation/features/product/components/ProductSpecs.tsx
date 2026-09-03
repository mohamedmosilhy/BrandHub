import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { ProductSpec } from '@domain/catalog';

import { Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

/**
 * The specification table has no counterpart in the prototype — Phase 7 adds it, so it reuses
 * the PDP's own vocabulary: the delivery panel's `#F5F5F7` block and its 13 px padding, with a
 * hairline between rows rather than a new border treatment.
 */
export function ProductSpecs({ specs }: { specs: readonly ProductSpec[] }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (specs.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text variant="sm" weight="extrabold">
        {t('specifications')}
      </Text>
      <View
        style={[
          styles.table,
          { backgroundColor: theme.colors.background, borderRadius: 14 },
        ]}
      >
        {specs.map((spec, index) => (
          <View
            key={`${spec.name}-${spec.value}`}
            style={[
              styles.row,
              index > 0
                ? { borderTopColor: theme.colors.border, borderTopWidth: 1 }
                : null,
            ]}
          >
            <Text color={theme.colors.textSecondary} variant="xs">
              {spec.name}
            </Text>
            <Text style={styles.value} variant="xs" weight="semibold">
              {spec.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  section: { gap: 9 },
  table: { paddingHorizontal: 13 },
  value: { marginInlineStart: 'auto' },
});
