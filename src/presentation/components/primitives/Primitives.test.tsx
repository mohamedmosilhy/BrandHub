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

  // `textAlign` is written pre-mirror: both renderers swap left/right themselves once the text
  // node's layout direction is RTL, so `'left'` is the reading start and `'right'` the reading
  // end. Asserting `'right'` for Arabic here is what produced left-aligned Arabic on device.
  // See `presentation/theme/direction.ts` for the iOS and Android sources.
  it('aligns Arabic to the reading start without depending on native RTL state', async () => {
    await render(<Text testID="rtl-copy">محتوى عربي</Text>);
    const copy = screen.getByTestId('rtl-copy');
    expect(copy).toHaveStyle({ writingDirection: 'rtl' });
    const style = StyleSheet.flatten(copy.props['style']);
    expect(style.textAlign).toBe('left');
    // No `direction` override: the run inherits the screen's RTL node and is mirrored with it.
    expect(style.direction).toBeUndefined();
  });

  it('aligns to the reading end when asked, still pre-mirror', async () => {
    await render(
      <Text align="end" testID="end-copy">
        محتوى عربي
      </Text>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('end-copy').props['style'])
        .textAlign,
    ).toBe('right');
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
    const style = StyleSheet.flatten(copy.props['style']);
    // Its own LTR node, so the platform mirrors nothing and the digits keep Latin order.
    expect(style.direction).toBe('ltr');
    expect(style.textAlign).toBe('left');
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

  it('draws compact controls at their declared size and completes the target with hit slop', async () => {
    await render(
      <Pressable accessibilityLabel="Compact action" compact compactSize={36}>
        <Text>+</Text>
      </Pressable>,
    );
    const action = screen.getByRole('button', { name: 'Compact action' });
    expect(action).toHaveStyle({ minHeight: 36, minWidth: 36 });
    expect(action.props['hitSlop']).toBe(4);
  });
});
