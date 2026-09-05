import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { Influencer } from '@domain/social';

import { Image, Text } from '@presentation/components/primitives';
import { toneAt, useTheme } from '@presentation/theme';

/** The first character of a name, in whichever script it is written. */
export function influencerInitial(name: string): string {
  return [...name.trim()][0] ?? '';
}

/**
 * The prototype's brand-gradient ring: a `linear-gradient(135deg, #7F77DD → #D4537E)` disc,
 * a white inner edge, and the influencer's initial on a rotated tone where there is no picture.
 * Drawn at 62 px on the home rail, 52 px on the directory row and 78 px on the profile.
 */
export function InfluencerAvatar({
  influencer,
  index = 0,
  size,
  ring,
  variant = 'body',
}: {
  influencer: Pick<Influencer, 'name' | 'avatarUrl'>;
  index?: number;
  size: number;
  ring: number;
  variant?: 'h3' | 'h2' | 'body';
}) {
  const { theme } = useTheme();
  const inner = size - ring * 2;
  return (
    <LinearGradient
      colors={theme.gradients.brand.colors}
      end={theme.gradients.brand.end}
      start={theme.gradients.brand.start}
      style={{ borderRadius: theme.radius.full, height: size, width: size }}
    >
      {influencer.avatarUrl ? (
        <Image
          accessibilityLabel={influencer.name}
          contentFit="cover"
          source={{ uri: influencer.avatarUrl }}
          style={[
            styles.inner,
            {
              borderColor: theme.colors.surface,
              borderRadius: theme.radius.full,
              borderWidth: ring,
              height: inner,
              margin: ring,
              width: inner,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: toneAt(index),
              borderColor: theme.colors.surface,
              borderRadius: theme.radius.full,
              borderWidth: ring,
              height: inner,
              margin: ring,
              width: inner,
            },
          ]}
        >
          <Text variant={variant} weight="bold">
            {influencerInitial(influencer.name)}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
