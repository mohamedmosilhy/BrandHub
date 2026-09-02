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
      fontSize: 15,
      lineHeight: 27,
    });
    expect(body.props['maxFontSizeMultiplier']).toBe(1.3);
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
