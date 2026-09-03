import { StyleSheet } from 'react-native';

import { layout } from '@presentation/theme';

import { render, screen } from '@test/render';

import { Pressable } from './Pressable';
import { Text } from './Text';

describe('presentation primitives', () => {
  it('uses Noto Kufi Arabic, 1.75 line height and a 130% font cap', async () => {
    await render(<Text testID="arabic-body">نص عربي</Text>);
    const body = screen.getByTestId('arabic-body');
    expect(body).toHaveStyle({
      fontFamily: 'NotoKufiArabic_400Regular',
      fontSize: 13,
      lineHeight: 23,
    });
    expect(body.props['maxFontSizeMultiplier']).toBe(1.3);
  });

  it('aligns Arabic to the reading start without depending on native RTL state', async () => {
    await render(<Text testID="rtl-copy">محتوى عربي</Text>);
    const copy = screen.getByTestId('rtl-copy');
    expect(copy).toHaveStyle({
      writingDirection: 'rtl',
    });
    expect(StyleSheet.flatten(copy.props['style']).textAlign).toBe('right');
  });

  it('keeps Latin-only runs LTR inside Arabic screens', async () => {
    await render(
      <Text latin testID="latin-copy">
        +968 9911 2233
      </Text>,
    );
    const copy = screen.getByTestId('latin-copy');
    expect(copy).toHaveStyle({
      fontFamily: 'PlusJakartaSans_400Regular',
      writingDirection: 'ltr',
    });
    expect(StyleSheet.flatten(copy.props['style']).textAlign).toBe('left');
  });

  it('gives every pressable at least a 44pt target', async () => {
    await render(
      <Pressable accessibilityLabel="Action">
        <Text>Action</Text>
      </Pressable>,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toHaveStyle({
      minHeight: layout.minimumTouchTarget,
      minWidth: layout.minimumTouchTarget,
    });
  });
});
