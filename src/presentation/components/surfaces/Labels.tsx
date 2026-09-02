import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Image, Text } from '@presentation/components/primitives';
import { spacing, useTheme } from '@presentation/theme';

export type BadgeTone =
  'accent' | 'pink' | 'success' | 'warning' | 'danger' | 'neutral';

type LabelProps = {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
};

type BadgeProps = LabelProps & { rounded?: boolean };

function toneColors(
  tone: BadgeTone,
  theme: ReturnType<typeof useTheme>['theme'],
) {
  switch (tone) {
    case 'pink':
      return [theme.colors.pinkLight, theme.colors.pinkAccessible] as const;
    case 'success':
      return [
        theme.colors.successLight,
        theme.colors.successAccessible,
      ] as const;
    case 'warning':
      return [
        theme.colors.warningLight,
        theme.colors.warningAccessible,
      ] as const;
    case 'danger':
      return [theme.colors.dangerLight, theme.colors.dangerAccessible] as const;
    case 'neutral':
      return [theme.colors.background, theme.colors.textSecondary] as const;
    case 'accent':
      return [theme.colors.accentLight, theme.colors.textPrimary] as const;
  }
}

export function Badge({
  label,
  tone = 'pink',
  icon,
  rounded = false,
}: BadgeProps) {
  const { theme } = useTheme();
  const [backgroundColor, color] = toneColors(tone, theme);
  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.label,
        {
          backgroundColor,
          borderRadius: rounded ? theme.radius.full : theme.radius.sm,
          paddingHorizontal: theme.spacing.x2,
          paddingVertical: theme.spacing.x1,
        },
      ]}
    >
      {icon}
      <Text color={color} variant="xs" weight="semibold">
        {label}
      </Text>
    </View>
  );
}

export function Pill(props: LabelProps) {
  return <Badge {...props} rounded />;
}

export function StatusPill(props: LabelProps) {
  return <Pill {...props} />;
}

export type AvatarProps = {
  accessibilityLabel: string;
  initials: string;
  source?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function Avatar({
  accessibilityLabel,
  initials,
  source,
  size = 'md',
}: AvatarProps) {
  const { theme } = useTheme();
  const dimension =
    size === 'sm'
      ? theme.spacing.x8
      : size === 'lg'
        ? theme.spacing.x16
        : theme.spacing.x12;
  if (source) {
    return (
      <Image
        accessibilityLabel={accessibilityLabel}
        source={{ uri: source }}
        style={{
          borderRadius: theme.radius.full,
          height: dimension,
          width: dimension,
        }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.accentLight,
        borderRadius: theme.radius.full,
        height: dimension,
        justifyContent: 'center',
        width: dimension,
      }}
    >
      <Text color={theme.colors.textPrimary} weight="bold">
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.x1,
  },
});
