import { StyleSheet, View } from 'react-native';

import { Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type ProductBadge = Readonly<{
  label: string;
  tone: 'accent' | 'pink' | 'neutral';
}>;

/**
 * `font-size: 9.5px; font-weight: 700; border-radius: 99px; padding: 4px 10px` — the PDP's own
 * pill, tinted rather than filled. The shared `Badge` is a squarer, larger label used for status
 * chips elsewhere; this row is the prototype's discount and express pair and nothing else.
 */
export function ProductBadges({ badges }: { badges: readonly ProductBadge[] }) {
  const { theme } = useTheme();
  if (badges.length === 0) return null;
  const palette = {
    accent: [theme.colors.accentLight, theme.colors.accentHover],
    pink: [theme.colors.pinkLight, theme.colors.pinkAccessible],
    neutral: [theme.colors.background, theme.colors.textSecondary],
  } as const;

  return (
    <View style={styles.row}>
      {badges.map((badge) => {
        const [background, color] = palette[badge.tone];
        return (
          <View
            key={badge.label}
            style={{
              backgroundColor: background,
              borderRadius: theme.radius.full,
              paddingHorizontal: theme.mobile.pdp.badgePaddingX,
              paddingVertical: theme.mobile.pdp.badgePaddingY,
            }}
          >
            <Text color={color} variant="nano" weight="bold">
              {badge.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 7 },
});
