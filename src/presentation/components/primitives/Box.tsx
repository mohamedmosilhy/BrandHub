import type { ReactNode } from 'react';
import {
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type BoxProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  testID?: string;
};

export function Box({
  children,
  style,
  accessibilityLabel,
  accessibilityRole,
  testID,
}: BoxProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={style}
      testID={testID}
    >
      {children}
    </View>
  );
}
