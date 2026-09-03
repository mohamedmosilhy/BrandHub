import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';

import { useTheme } from '@presentation/theme';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  accessibilityLabel?: string;
  /**
   * The prototype paints Home and Browse on `#F5F5F7` and Category and Search on `#fff`.
   * Defaults to the page background.
   */
  background?: string;
  /**
   * Full-bleed screens draw their own header bands, rails and dividers edge to edge, so the
   * content padding has to come off. `Category`, `Search` and `Browse` are all of that shape.
   */
  edgeToEdge?: boolean;
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  gap?: number;
  /**
   * The bottom safe area belongs to whichever surface actually sits at the bottom of the
   * display. Under the tab navigator that is `BrandTabBar`, which already adds `insets.bottom`
   * to its own padding — a screen that claimed it as well would leave a band of page background
   * between its last row and the bar's top border. Screens that are themselves the bottom-most
   * surface, such as a full-screen modal, opt back in.
   */
  bottomInset?: boolean;
};

const WITH_BOTTOM: Edges = ['top', 'right', 'bottom', 'left'];
const WITHOUT_BOTTOM: Edges = ['top', 'right', 'left'];

export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
  accessibilityLabel,
  background,
  edgeToEdge = false,
  paddingX,
  paddingTop,
  paddingBottom,
  gap,
  bottomInset = false,
}: ScreenProps) {
  const { theme, isRTL } = useTheme();
  const contentStyle = {
    flexGrow: 1,
    gap: gap ?? theme.mobile.gapSection,
    paddingHorizontal: edgeToEdge
      ? 0
      : (paddingX ?? theme.mobile.screenPaddingX),
    paddingTop: paddingTop ?? (edgeToEdge ? 0 : theme.mobile.screenPaddingY),
    paddingBottom:
      paddingBottom ?? (edgeToEdge ? 0 : theme.mobile.screenPaddingY),
  };
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.safe, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView
      accessibilityLabel={accessibilityLabel}
      edges={bottomInset ? WITH_BOTTOM : WITHOUT_BOTTOM}
      style={[
        styles.safe,
        {
          backgroundColor: background ?? theme.colors.background,
          direction: isRTL ? 'rtl' : 'ltr',
        },
      ]}
    >
      {keyboardAware ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safe}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 } });
