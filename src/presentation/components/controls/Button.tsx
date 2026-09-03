import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  Pressable,
  Text,
  type TextVariant,
} from '@presentation/components/primitives';
import { mobile, useTheme } from '@presentation/theme';

export type ButtonVariant =
  'primary' | 'secondary' | 'accentOutline' | 'ghost' | 'danger';
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
  inverse?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string | undefined;
};

/**
 * Geometry from the app prototype: the primary CTA is `height: 50px; border-radius: 15px;
 * font-size: 13.5px; font-weight: 700`; secondary actions use the reference border token,
 * 48px height, 14px radius and 12.5px type; compact actions are 38–40px.
 *
 * Filled backgrounds use `accentHover` / `dangerAccessible` rather than the raw brand colours:
 * the reference white-on-accent and white-on-danger pairs are both below AA for label text at
 * these sizes. That substitution is the Phase 2 contrast audit's recorded remedy.
 */
const SIZE: Record<
  ButtonSize,
  { height: number; radius: number; variant: TextVariant; paddingX: number }
> = {
  sm: {
    height: mobile.buttonHeight.sm,
    radius: 12,
    variant: 'xs',
    paddingX: 16,
  },
  md: {
    height: mobile.buttonHeight.md,
    radius: 14,
    variant: 'sm',
    paddingX: 18,
  },
  lg: {
    height: mobile.buttonHeight.lg,
    radius: 15,
    variant: 'body',
    paddingX: 20,
  },
};

export function Button({
  label,
  accessibilityLabel = label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  inverse = false,
  icon,
  style,
  testID,
}: ButtonProps) {
  const { theme } = useTheme();
  const filled = variant === 'primary' || variant === 'danger';
  // The PDP buy bar's add-to-cart is `1.5px solid #7F77DD` with accent text on white — an
  // outline in the brand colour rather than in the neutral border token `secondary` uses.
  const accentOutlined = variant === 'accentOutline';
  const outlined = variant === 'secondary' || accentOutlined;
  const foreground = inverse
    ? theme.colors.onDarkPrimary
    : filled
      ? theme.colors.textInverse
      : outlined && !accentOutlined
        ? theme.colors.textPrimary
        : theme.colors.accentHover;
  const background =
    variant === 'primary'
      ? theme.colors.accentHover
      : variant === 'danger'
        ? theme.colors.dangerAccessible
        : theme.colors.transparent;
  const borderColor = inverse
    ? theme.colors.onDarkBorder
    : accentOutlined
      ? theme.colors.accentHover
      : outlined
        ? theme.colors.border
        : background;
  const metrics = SIZE[size];

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
          backgroundColor: inverse
            ? theme.colors.transparent
            : outlined
              ? theme.colors.surface
              : background,
          borderColor,
          borderRadius: metrics.radius,
          borderWidth: outlined ? 1.5 : 1,
          height: metrics.height,
          paddingHorizontal: metrics.paddingX,
        },
        style,
      ]}
    >
      <View style={[styles.content, { gap: theme.mobile.gapHairline }]}>
        {icon}
        <Text
          align="center"
          color={foreground}
          variant={metrics.variant}
          weight="bold"
          style={loading ? styles.hiddenLabel : undefined}
        >
          {label}
        </Text>
        {loading ? (
          <View style={styles.spinner} testID="button-spinner">
            <ActivityIndicator color={foreground} size="small" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center' },
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
