import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

import { useTheme } from '@presentation/theme';

export type IconName =
  | 'arrow-back'
  | 'bell'
  | 'cart'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'filter'
  | 'heart'
  | 'home'
  | 'map-pin'
  | 'minus'
  | 'person'
  | 'plus'
  | 'search'
  | 'star'
  | 'warning';

const directional = new Set<IconName>(['arrow-back']);

function Glyph({ name }: { name: IconName }): ReactNode {
  switch (name) {
    case 'arrow-back':
      return <Path d="M15 5l-7 7 7 7" />;
    case 'bell':
      return (
        <>
          <Path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 7-2.5 8.5h17c0-1.5-2.5-2-2.5-8.5z" />
          <Path d="M10.3 20.5a1.8 1.8 0 0 0 3.4 0" />
        </>
      );
    case 'cart':
      return (
        <>
          <Path d="M4 5h2.2l2 10.5h9.4L20 8H7" />
          <Circle cx="9.5" cy="19" r="1.4" />
          <Circle cx="17" cy="19" r="1.4" />
        </>
      );
    case 'check':
      return <Polyline points="5 12.5 9.5 17 19 7.5" />;
    case 'chevron-down':
      return <Polyline points="5 9 12 16 19 9" />;
    case 'close':
      return (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" />
          <Line x1="18" y1="6" x2="6" y2="18" />
        </>
      );
    case 'eye':
      return (
        <>
          <Path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
          <Circle cx="12" cy="12" r="2.6" />
        </>
      );
    case 'eye-off':
      return (
        <>
          <Path d="M3 3l18 18M10.6 5.7A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-2.2 3.1M6.2 6.2C3.5 8.1 2 12 2 12s3.6 6.5 10 6.5c1.1 0 2.1-.2 3-.5" />
        </>
      );
    case 'filter':
      return <Path d="M4 7h16M7 12h10M10 17h4" />;
    case 'heart':
      return (
        <Path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20z" />
      );
    case 'home':
      return (
        <>
          <Path d="M3 10.5 12 3l9 7.5" />
          <Path d="M5 9.5V21h14V9.5" />
        </>
      );
    case 'map-pin':
      return (
        <>
          <Path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
          <Circle cx="12" cy="10" r="2.6" />
        </>
      );
    case 'minus':
      return <Line x1="6" y1="12" x2="18" y2="12" />;
    case 'person':
      return (
        <>
          <Circle cx="12" cy="8" r="3.6" />
          <Path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" />
        </>
      );
    case 'plus':
      return (
        <>
          <Line x1="6" y1="12" x2="18" y2="12" />
          <Line x1="12" y1="6" x2="12" y2="18" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" />
          <Path d="m20 20-3.5-3.5" />
        </>
      );
    case 'star':
      return (
        <Path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
      );
    case 'warning':
      return (
        <>
          <Path d="M12 3 2.8 20h18.4L12 3z" />
          <Line x1="12" y1="9" x2="12" y2="14" />
          <Circle cx="12" cy="17" r=".6" />
        </>
      );
  }
}

export type IconProps = {
  name: IconName;
  accessibilityLabel?: string;
  size?: number;
  color?: string;
  filled?: boolean;
  testID?: string;
};

export function Icon({
  name,
  accessibilityLabel,
  size,
  color,
  filled = false,
  testID,
}: IconProps) {
  const { theme, isRTL } = useTheme();
  const resolvedSize = size ?? theme.iconSizes.md;
  const resolvedColor = color ?? theme.colors.textPrimary;
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      style={
        directional.has(name) && isRTL
          ? { transform: [{ scaleX: -1 }] }
          : undefined
      }
      testID={testID}
    >
      <Svg
        width={resolvedSize}
        height={resolvedSize}
        viewBox="0 0 24 24"
        fill={filled ? resolvedColor : 'none'}
        stroke={resolvedColor}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph name={name} />
      </Svg>
    </View>
  );
}
