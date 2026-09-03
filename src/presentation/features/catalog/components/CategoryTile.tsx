import { StyleSheet, View } from 'react-native';

import type { Category } from '@domain/catalog';

import { Image, Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export function CategoryTile({
  category,
  onPress,
}: {
  category: Category;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={category.title}
      onPress={onPress}
      style={styles.root}
    >
      <View
        style={[
          styles.imageShell,
          {
            backgroundColor: theme.colors.accentLight,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Image
          accessibilityLabel={category.title}
          contentFit="contain"
          source={{ uri: category.imageUrl }}
          style={styles.image}
        />
      </View>
      <Text align="center" numberOfLines={2} variant="micro" weight="semibold">
        {category.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: { height: '100%', width: '100%' },
  imageShell: { aspectRatio: 1, overflow: 'hidden', width: '100%' },
  root: { alignItems: 'center', flexBasis: '22%', flexGrow: 1, gap: 7 },
});
