import { Platform, StyleSheet, View } from 'react-native';

import {
  Icon,
  type IconName,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type NavigationTab = Readonly<{
  key: string;
  label: string;
  icon: IconName;
  badge?: number;
}>;

export function BrandTabBar({
  tabs,
  activeIndex,
  onPress,
}: {
  tabs: readonly NavigationTab[];
  activeIndex: number;
  onPress: (index: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: theme.spacing.x20,
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab.key}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onPress(index)}
            style={styles.tab}
          >
            <View
              style={[
                styles.icon,
                Platform.OS === 'android' && active
                  ? {
                      backgroundColor: theme.colors.accentLight,
                      borderRadius: theme.radius.full,
                      paddingHorizontal: theme.spacing.x4,
                    }
                  : undefined,
              ]}
            >
              <Icon
                name={tab.icon}
                color={
                  active ? theme.colors.accent : theme.colors.textSecondary
                }
              />
              {tab.badge ? (
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: theme.colors.pink,
                    borderRadius: theme.radius.full,
                    minWidth: theme.spacing.x5,
                    paddingHorizontal: theme.spacing.x1,
                    position: 'absolute',
                    end: -theme.spacing.x2,
                    top: -theme.spacing.x1,
                  }}
                >
                  <Text
                    color={theme.colors.textInverse}
                    variant="xs"
                    weight="bold"
                  >
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              color={active ? theme.colors.accent : theme.colors.textSecondary}
              variant="xs"
              weight={active ? 'semibold' : 'regular'}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, flexDirection: 'row' },
  icon: { alignItems: 'center', justifyContent: 'center' },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
