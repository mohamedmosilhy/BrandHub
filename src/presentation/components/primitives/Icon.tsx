import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { useTheme } from '@presentation/theme';

export type IconName =
  | 'arrow-back'
  | 'bell'
  | 'cart'
  | 'chat'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'chevron-forward'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'map-pin'
  | 'minus'
  | 'person'
  | 'plus'
  | 'search'
  | 'shield'
  | 'star'
  | 'truck'
  | 'warning';

const directional = new Set<IconName>(['arrow-back', 'chevron-forward']);

/**
 * The prototype draws each glyph at its own weight — 1.8 for chrome and tab icons, 2 for the
 * back chevron and the filter rule, 2.4 for the toast check. Flattening them all to one weight
 * makes the tab bar look heavy and the toast check look thin, so the reference's per-icon
 * `stroke-width` is carried here verbatim. 1.8 is the prototype's most common value.
 */
const STROKE: Partial<Record<IconName, number>> = {
  'arrow-back': 2,
  'chevron-forward': 2,
  check: 2.4,
  close: 2,
  filter: 2,
  minus: 2,
  plus: 2,
  search: 1.9,
  eye: 1.9,
  'eye-off': 1.9,
};
const DEFAULT_STROKE = 1.8;

/** Glyphs the prototype paints as a solid shape rather than stroking. */
const SOLID = new Set<IconName>(['star', 'heart']);

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
    // The prototype's comment bubble, on the shoppable post card beside the like count.
    case 'chat':
      return (
        <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1-5.3a8.5 8.5 0 1 1 17-3.2z" />
      );
    case 'check':
      return <Polyline points="5 12.5 9.5 17 19 7.5" />;
    case 'chevron-down':
      return <Polyline points="5 9 12 16 19 9" />;
    case 'chevron-forward':
      return <Path d="m9 5 7 7-7 7" />;
    case 'grid':
      return (
        <>
          <Rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
          <Rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
          <Rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
          <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </>
      );
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
    // The PDP's delivery and returns promises, traced from the prototype's own two glyphs.
    case 'truck':
      return (
        <>
          <Rect x="2" y="7" width="12" height="9" rx="1.6" />
          <Path d="M14 10h4l3 3v3h-7z" />
          <Circle cx="6.5" cy="18" r="1.6" />
          <Circle cx="17" cy="18" r="1.6" />
        </>
      );
    case 'shield':
      return (
        <>
          <Path d="M12 3 4 6v6c0 4.6 3.4 8.2 8 9 4.6-.8 8-4.4 8-9V6z" />
          <Path d="m9 12 2 2 4-4" />
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
        // A filled star or heart is drawn solid in the prototype, with no outline on top of it.
        stroke={filled && SOLID.has(name) ? 'none' : resolvedColor}
        strokeWidth={STROKE[name] ?? DEFAULT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph name={name} />
      </Svg>
    </View>
  );
}
