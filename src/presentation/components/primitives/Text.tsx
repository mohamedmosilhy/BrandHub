import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text as NativeText,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@presentation/theme';

export type TextVariant =
  'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'sm' | 'xs';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string | undefined;
  align?: 'auto' | 'center' | 'justify';
  numberOfLines?: number | undefined;
  accessibilityLabel?: string | undefined;
  style?: StyleProp<TextStyle> | undefined;
  testID?: string | undefined;
};

export function Text({
  children,
  variant = 'body',
  weight = 'regular',
  color,
  align = 'auto',
  numberOfLines,
  accessibilityLabel,
  style,
  testID,
}: TextProps) {
  const { i18n } = useTranslation();
  const { theme, isRTL } = useTheme();
  const arabic = i18n.language === 'ar';
  const fontSize = theme.fontSizes[variant];
  const fontFamily = theme.fontFamilies[arabic ? 'arabic' : 'latin'][weight];
  const lineHeight = Math.ceil(
    fontSize * (arabic ? theme.lineHeights.arabic : theme.lineHeights.normal),
  );

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
          lineHeight,
          textAlign: align,
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        style,
      ]}
    >
      {children}
    </NativeText>
  );
}
