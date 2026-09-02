import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type ToastTone = 'success' | 'error' | 'info';
export type ToastMessage = { message: string; tone?: ToastTone };

type ToastContextValue = { showToast: (toast: ToastMessage) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function Toast({ message, tone = 'info' }: ToastMessage) {
  const { theme } = useTheme();
  const color =
    tone === 'success'
      ? theme.colors.success
      : tone === 'error'
        ? theme.colors.danger
        : theme.colors.accent;
  return (
    <View
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.ink,
          borderRadius: theme.radius.md,
          bottom: theme.spacing.x6,
          boxShadow: theme.shadows.lg.boxShadow,
          gap: theme.spacing.x2,
          padding: theme.spacing.x4,
          zIndex: theme.zIndices.toast,
        },
      ]}
    >
      <Icon
        name={tone === 'error' ? 'warning' : 'check'}
        color={color}
        size={theme.iconSizes.sm}
      />
      <Text color={theme.colors.textInverse} variant="sm" weight="medium">
        {message}
      </Text>
    </View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((next: ToastMessage) => setToast(next), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(
      () => setToast(null),
      theme.durations.slow * 4.75,
    );
    return () => clearTimeout(timeout);
  }, [theme.durations.slow, toast]);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <Toast {...toast} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider.');
  return value;
}

const styles = StyleSheet.create({
  toast: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    position: 'absolute',
  },
});
