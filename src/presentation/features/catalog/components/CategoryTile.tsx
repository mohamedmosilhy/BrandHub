import { StyleSheet, View } from 'react-native';

import type { Category } from '@domain/catalog';

import { Image, Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

import { categoryArtworkSource } from './mockArtwork';

/**
 * `catTiles` in the prototype: a four-column grid of square, 16 px-radius tiles, each on its
 * own tint from the `TONES` rotation, with the artwork inset to 74 % of the tile.
 */
export function CategoryTile({
  category,
  tone,
  onPress,
}: {
  category: Category;
  tone?: string;
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
            backgroundColor: tone ?? theme.colors.accentLight,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Image
          accessibilityLabel={category.title}
          contentFit="contain"
          source={categoryArtworkSource(category.imageUrl, category.id)}
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
  image: { height: '74%', width: '74%' },
  imageShell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  root: { alignItems: 'center', flexBasis: '22%', flexGrow: 1, gap: 7 },
});
