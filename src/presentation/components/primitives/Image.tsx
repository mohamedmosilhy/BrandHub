import { Image as ExpoImage, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@presentation/theme';

import { Icon } from './Icon';

export type ImageProps = {
  source: ImageSource | number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain';
  testID?: string;
};

export function Image({
  source,
  accessibilityLabel,
  style,
  contentFit = 'cover',
  testID,
}: ImageProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[
        { backgroundColor: theme.colors.accentLight, overflow: 'hidden' },
        style,
      ]}
      testID={testID}
    >
      {failed ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="warning" color={theme.colors.textSecondary} />
        </View>
      ) : (
        <ExpoImage
          source={source}
          contentFit={contentFit}
          transition={theme.durations.fast}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </View>
  );
}
