import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Icon,
  type IconName,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { mobile, useTheme } from '@presentation/theme';

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
  const { theme, direction } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          direction,
          paddingBottom: theme.mobile.tabBar.paddingBottom + insets.bottom,
          paddingHorizontal: theme.mobile.tabBar.paddingX,
          paddingTop: theme.mobile.tabBar.paddingTop,
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
            compact
            compactSize={theme.mobile.tabBar.pillHeight}
            onPress={() => onPress(index)}
            style={styles.tab}
          >
            <View
              style={[
                styles.icon,
                active
                  ? {
                      backgroundColor: theme.colors.accentLight,
                      borderRadius: theme.mobile.tabBar.pillRadius,
                    }
                  : undefined,
              ]}
            >
              <Icon
                name={tab.icon}
                size={theme.mobile.tabBar.iconSize}
                color={active ? theme.colors.accent : theme.colors.textMuted}
              />
              {tab.badge ? (
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: theme.colors.pink,
                    borderRadius: theme.radius.full,
                    height: theme.mobile.tabBar.badgeSize,
                    minWidth: theme.mobile.tabBar.badgeSize,
                    paddingHorizontal: theme.spacing.x1,
                    position: 'absolute',
                    end: theme.mobile.gapHairline,
                    top: -2,
                  }}
                >
                  <Text
                    color={theme.colors.textInverse}
                    latin
                    variant="micro"
                    weight="bold"
                  >
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              color={active ? theme.colors.accent : theme.colors.textMuted}
              variant="micro"
              weight="semibold"
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
  icon: {
    alignItems: 'center',
    height: mobile.tabBar.pillHeight,
    justifyContent: 'center',
    width: mobile.tabBar.pillWidth,
  },
  tab: { alignItems: 'center', flex: 1, gap: mobile.tabBar.gap },
});
