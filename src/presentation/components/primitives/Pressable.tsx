import type { ReactNode } from 'react';
import {
  Pressable as NativePressable,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@presentation/theme';

export type PressableProps = {
  accessibilityLabel: string;
  children: ReactNode;
  onPress?: (() => void) | undefined;
  onPressIn?: (() => void) | undefined;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  };
  disabled?: boolean | undefined;
  /**
   * The prototype draws several controls below 44 pt — 30 pt tab pills, 32 pt chips, 34 pt
   * icon buttons. `compact` drops the 44 pt minimum box and buys the same target back with
   * `hitSlop`, so the drawing matches the reference and AC2.10 still holds.
   */
  compact?: boolean;
  /** Drawn height of a compact control, used to size the hit slop. Defaults to 32. */
  compactSize?: number;
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
};

export function Pressable({
  accessibilityLabel,
  children,
  onPress,
  onPressIn,
  accessibilityRole = 'button',
  accessibilityState,
  disabled = false,
  compact = false,
  compactSize,
  style,
  testID,
}: PressableProps) {
  const { theme } = useTheme();
  const target = theme.layout.minimumTouchTarget;
  const drawn = compactSize ?? theme.mobile.chipHeight;
  const slop = compact
    ? Math.max(theme.spacing.x1, Math.ceil((target - drawn) / 2))
    : theme.spacing.x1;

  return (
    <NativePressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      hitSlop={slop}
      onPress={onPress}
      onPressIn={onPressIn}
      testID={testID}
      style={({ pressed }) => [
        compact
          ? { opacity: pressed ? 0.72 : disabled ? 0.5 : 1 }
          : {
              minHeight: target,
              minWidth: target,
              opacity: pressed ? 0.72 : disabled ? 0.5 : 1,
            },
        style,
      ]}
    >
      {children}
    </NativePressable>
  );
}
