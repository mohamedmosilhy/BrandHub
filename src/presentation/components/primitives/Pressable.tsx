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
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  };
  disabled?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
};

export function Pressable({
  accessibilityLabel,
  children,
  onPress,
  accessibilityRole = 'button',
  accessibilityState,
  disabled = false,
  style,
  testID,
}: PressableProps) {
  const { theme } = useTheme();
  return (
    <NativePressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      hitSlop={theme.spacing.x1}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        {
          minHeight: theme.layout.minimumTouchTarget,
          minWidth: theme.layout.minimumTouchTarget,
          opacity: pressed ? 0.72 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {children}
    </NativePressable>
  );
}
