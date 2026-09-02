import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type ScreenHeaderProps = {
  title: string;
  backLabel?: string;
  onBack?: () => void;
  actions?: ReactNode;
};

export function ScreenHeader({
  title,
  backLabel = 'Back',
  onBack,
  actions,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="header"
      style={[
        styles.screenHeader,
        {
          borderBottomColor: theme.colors.border,
          minHeight: theme.layout.headerHeight,
        },
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={styles.headerAction}
        >
          <Icon name="arrow-back" testID="screen-header-back-icon" />
        </Pressable>
      ) : (
        <View style={{ width: theme.layout.minimumTouchTarget }} />
      )}
      <Text align="center" variant="h3" weight="bold" style={styles.title}>
        {title}
      </Text>
      <View
        style={[
          styles.headerAction,
          { minWidth: theme.layout.minimumTouchTarget },
        ]}
      >
        {actions}
      </View>
    </View>
  );
}

export type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: (() => void) | undefined;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="header" style={styles.sectionHeader}>
      <Text variant="h3" weight="bold">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.headerAction}
        >
          <Text color={theme.colors.accentHover} variant="sm" weight="semibold">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: { alignItems: 'center', justifyContent: 'center' },
  screenHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { flex: 1 },
});
