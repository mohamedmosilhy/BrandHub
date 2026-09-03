import { Text } from '@presentation/components/primitives';

import { render, screen } from '@test/render';

import { Screen } from './Screen';

/**
 * `SafeAreaView` treats a missing `edges` prop as "pad all four", so a tab screen used to
 * reserve `insets.bottom` of its own on top of the `insets.bottom` `BrandTabBar` already adds —
 * a band of page background between the page and the bar's top border.
 */
describe('Screen safe area', () => {
  it('leaves the bottom inset to whatever sits below it', async () => {
    await render(
      <Screen accessibilityLabel="Home">
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByLabelText('Home').props['edges']).toMatchObject({
      bottom: 'off',
      top: 'additive',
    });
  });

  it('pads the bottom inset when the screen is the bottom-most surface', async () => {
    await render(
      <Screen accessibilityLabel="Checkout" bottomInset>
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByLabelText('Checkout').props['edges']).toMatchObject({
      bottom: 'additive',
      top: 'additive',
    });
  });
});
