import { ThemeProvider } from '@presentation/theme';

import { render, screen } from '@test/render';

import { ScreenHeader } from './Headers';

describe('ScreenHeader', () => {
  it('exposes the back control and directional icon', async () => {
    await render(
      <ScreenHeader title="Orders" backLabel="Back" onBack={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeOnTheScreen();
    expect(screen.getByTestId('screen-header-back-icon')).toBeOnTheScreen();
  });

  it('flips the visual-start back chevron in RTL', async () => {
    await render(
      <ThemeProvider initialRTL>
        <ScreenHeader
          title="Orders"
          backLabel="Back"
          onBack={() => undefined}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('screen-header-back-icon')).toHaveStyle({
      transform: [{ scaleX: -1 }],
    });
  });
});
