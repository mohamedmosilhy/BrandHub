import type { ReactNode } from 'react';
import {
  Text as NativeText,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import {
  textEnd,
  textStart,
  useTheme,
  writingDirection,
} from '@presentation/theme';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'sm'
  | 'xs'
  | 'xxs'
  | 'micro';
export type TextWeight =
  'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/**
 * `start`/`end` follow the reading direction; `auto` is a synonym for `start`. Physical
 * alignment is deliberately not offered — it does not mirror.
 */
export type TextAlign = 'auto' | 'start' | 'end' | 'center' | 'justify';

export type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string | undefined;
  align?: TextAlign;
  /** Latin-only runs — prices, phone numbers, emails — that must stay LTR inside Arabic. */
  latin?: boolean;
  numberOfLines?: number | undefined;
  accessibilityLabel?: string | undefined;
  style?: StyleProp<TextStyle> | undefined;
  testID?: string | undefined;
};

const HEADINGS = new Set<TextVariant>(['display', 'h1', 'h2', 'h3']);

export function Text({
  children,
  variant = 'body',
  weight = 'regular',
  color,
  align = 'auto',
  latin = false,
  numberOfLines,
  accessibilityLabel,
  style,
  testID,
}: TextProps) {
  const { theme, isRTL } = useTheme();
  // A latin run keeps the Latin face and LTR order even when the app is Arabic.
  const arabic = isRTL && !latin;
  const fontSize = theme.fontSizes[variant];
  const fontFamily = theme.fontFamilies[arabic ? 'arabic' : 'latin'][weight];
  const multiplier = HEADINGS.has(variant)
    ? arabic
      ? theme.lineHeights.arabicTight
      : theme.lineHeights.tight
    : arabic
      ? theme.lineHeights.arabic
      : theme.lineHeights.normal;
  const runRTL = latin ? false : isRTL;

  return (
    <NativeText
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      testID={testID}
      maxFontSizeMultiplier={1.3}
      style={[
        {
          color: color ?? theme.colors.textPrimary,
          fontFamily,
          fontSize,
          lineHeight: Math.ceil(fontSize * multiplier),
          // Resolved explicitly: `auto` leaves Arabic left-aligned whenever the native RTL
          // flag has not been applied, which is every Expo Go session. See theme/direction.
          textAlign:
            align === 'center' || align === 'justify'
              ? align
              : align === 'end'
                ? textEnd(runRTL)
                : textStart(runRTL),
          writingDirection: writingDirection(runRTL),
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}
