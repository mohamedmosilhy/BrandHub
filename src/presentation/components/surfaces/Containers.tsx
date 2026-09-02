import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Modal as NativeModal, StyleSheet, View } from 'react-native';

import { Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type CardProps = {
  children: ReactNode;
  accessibilityLabel?: string;
  elevated?: boolean;
};

export function Card({
  children,
  accessibilityLabel,
  elevated = false,
}: CardProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        boxShadow: elevated ? theme.shadows.card.boxShadow : undefined,
        padding: theme.spacing.x4,
      }}
    >
      {children}
    </View>
  );
}

export type ModalProps = {
  visible: boolean;
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({
  visible,
  title,
  closeLabel,
  children,
  onClose,
}: ModalProps) {
  const { theme } = useTheme();
  return (
    <NativeModal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.centered, { backgroundColor: theme.colors.ink40 }]}>
        <View
          accessibilityRole="summary"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            gap: theme.spacing.x4,
            margin: theme.spacing.x6,
            maxWidth: theme.layout.containerMax,
            padding: theme.spacing.x5,
          }}
        >
          <Text variant="h3" weight="bold">
            {title}
          </Text>
          {children}
          <Pressable
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={styles.action}
          >
            <Text color={theme.colors.accent} weight="semibold">
              {closeLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </NativeModal>
  );
}

export function Sheet({
  visible,
  title,
  closeLabel,
  children,
  onClose,
}: ModalProps) {
  const { theme } = useTheme();
  return (
    <NativeModal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.sheetRoot, { backgroundColor: theme.colors.ink40 }]}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopStartRadius: theme.radius.xl,
            borderTopEndRadius: theme.radius.xl,
            gap: theme.spacing.x4,
            padding: theme.spacing.x5,
          }}
        >
          <View style={styles.sheetHeader}>
            <Text variant="h3" weight="bold">
              {title}
            </Text>
            <Pressable
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={styles.action}
            >
              <Text color={theme.colors.accent}>{closeLabel}</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </NativeModal>
  );
}

export type GradientPanelProps = {
  children: ReactNode;
  accessibilityLabel?: string;
  soft?: boolean;
};

export function GradientPanel({
  children,
  accessibilityLabel,
  soft = false,
}: GradientPanelProps) {
  const { theme } = useTheme();
  const gradient = soft ? theme.gradients.brandSoft : theme.gradients.brand;
  return (
    <LinearGradient
      accessibilityLabel={accessibilityLabel}
      colors={gradient.colors}
      end={gradient.end}
      start={gradient.start}
      style={{ borderRadius: theme.radius.lg, padding: theme.spacing.x5 }}
    >
      {children}
    </LinearGradient>
  );
}

export function Divider() {
  const { theme } = useTheme();
  return <View style={{ backgroundColor: theme.colors.border, height: 1 }} />;
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, justifyContent: 'center' },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
});
