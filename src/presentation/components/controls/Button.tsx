import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  accessibilityLabel?: string;
  onPress?: (() => void) | undefined;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  testID?: string | undefined;
};

export function Button({
  label,
  accessibilityLabel = label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  testID,
}: ButtonProps) {
  const { theme } = useTheme();
  const filled = variant === 'primary' || variant === 'danger';
  const foreground =
    variant === 'secondary'
      ? theme.colors.textPrimary
      : filled
        ? theme.colors.textInverse
        : theme.colors.accentHover;
  const background =
    variant === 'primary'
      ? theme.colors.accentHover
      : variant === 'danger'
        ? theme.colors.dangerAccessible
        : variant === 'secondary'
          ? theme.colors.accentLight
          : theme.colors.transparent;
  const verticalPadding =
    size === 'sm'
      ? theme.spacing.x1
      : size === 'lg'
        ? theme.spacing.x4
        : theme.spacing.x3;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={[
        styles.base,
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: background,
          borderColor:
            variant === 'ghost' ? theme.colors.transparent : background,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.x5,
          paddingVertical: verticalPadding,
        },
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          color={foreground}
          variant={size === 'sm' ? 'sm' : 'body'}
          weight="semibold"
          style={loading ? styles.hiddenLabel : undefined}
        >
          {label}
        </Text>
        {loading ? (
          <View style={styles.spinner} testID="button-spinner">
            <ActivityIndicator color={foreground} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, justifyContent: 'center' },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  hiddenLabel: { opacity: 0 },
  spinner: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    start: 0,
    end: 0,
    top: 0,
  },
});
