/**
 * Phase 1 diagnostics screen.
 *
 * It proves the configuration pipeline reaches the UI, and it proves the layer
 * boundary at the same time: this file imports nothing from `infrastructure` or
 * `data`. Everything it renders arrives as props from the composition root.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@presentation/theme';

export type EnvironmentRow = {
  readonly label: string;
  readonly value: string;
};

export type EnvironmentScreenProps = {
  readonly title: string;
  readonly environmentName: string;
  readonly rows: readonly EnvironmentRow[];
};

export function EnvironmentScreen({
  title,
  environmentName,
  rows,
}: EnvironmentScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.environment}>{environmentName}</Text>

        <View style={styles.divider} />

        {rows.map((row) => (
          <View
            key={row.label}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${row.value}`}
          >
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue} selectable>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x5,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.x5,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  environment: {
    marginTop: spacing.x2,
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.x4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.x2,
    gap: spacing.x4,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
    // No textAlign: flexbox already places this at the row's end, and a physical
    // 'right' would not mirror under RTL. See architecture.md §14.4.
  },
});
