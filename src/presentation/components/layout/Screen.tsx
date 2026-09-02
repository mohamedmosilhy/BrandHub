import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@presentation/theme';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  keyboardAware?: boolean;
  accessibilityLabel?: string;
};

export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
  accessibilityLabel,
}: ScreenProps) {
  const { theme, isRTL } = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{
        gap: theme.spacing.x5,
        padding: theme.spacing.x4,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: theme.spacing.x4 }}>{children}</View>
  );
  return (
    <SafeAreaView
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.safe,
        {
          backgroundColor: theme.colors.background,
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
