import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Icon,
  type IconName,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export function HorizontalRail({
  children,
  accessibilityLabel,
  gap,
}: {
  children: ReactNode;
  accessibilityLabel: string;
  /** The catalogue rails run on the 12 pt step; the PDP's related rail is 11 in the prototype. */
  gap?: number;
}) {
  const { theme } = useTheme();
  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: gap ?? theme.spacing.x3 }}
    >
      {children}
    </ScrollView>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.grid, { gap: theme.spacing.x3 }]}>{children}</View>
  );
}

export function StickyBottomBar({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        boxShadow: theme.shadows.md.boxShadow,
        padding: theme.spacing.x4,
      }}
    >
      {children}
    </View>
  );
}

export type TabItem = {
  key: string;
  label: string;
  icon: IconName;
  badge?: number;
};

export type TabBarProps = {
  items: readonly TabItem[];
  selectedKey: string;
  onSelect?: (key: string) => void;
};

export function TabBar({ items, selectedKey, onSelect }: TabBarProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.tabs,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: theme.spacing.x20,
        },
      ]}
    >
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect?.(item.key)}
            style={styles.tab}
          >
            <View>
              <Icon
                name={item.icon}
                color={
                  selected ? theme.colors.accent : theme.colors.textSecondary
                }
              />
              {item.badge ? (
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: theme.colors.pink,
                    borderRadius: theme.radius.full,
                    minWidth: theme.spacing.x5,
                    paddingHorizontal: theme.spacing.x1,
                    position: 'absolute',
                    end: -theme.spacing.x2,
                    top: -theme.spacing.x2,
                  }}
                >
                  <Text
                    color={theme.colors.textInverse}
                    variant="xs"
                    weight="bold"
                  >
                    {item.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              color={
                selected ? theme.colors.accent : theme.colors.textSecondary
              }
              variant="xs"
              weight={selected ? 'semibold' : 'regular'}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  tabs: { borderTopWidth: 1, flexDirection: 'row' },
});
