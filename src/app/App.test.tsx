/**
 * Covers the "displays the resolved environment name and API base URL" half of
 * plan.md AC1.9. The other half — launching on a simulator and an emulator —
 * needs Xcode and the Android SDK and is verified by hand.
 *
 * `expo-constants` is mocked because a test process has no Expo manifest; the
 * mock stands in for what `app.config.ts` publishes at build time.
 */
import { renderWithProviders, screen } from '@test/render';

import App from './App';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        env: 'staging',
        apiBaseUrl: 'https://staging-api.brandhub.om/api/v1',
        defaultLocale: 'ar',
        requestTimeoutMs: '15000',
        enableDevMenu: 'false',
      },
    },
  },
}));

describe('App', () => {
  it('renders the environment resolved from configuration', async () => {
    await renderWithProviders(<App />);

    expect(screen.getByText('staging')).toBeOnTheScreen();
  });

  it('renders the API base URL the app will call', async () => {
    await renderWithProviders(<App />);

    expect(
      screen.getByText('https://staging-api.brandhub.om/api/v1'),
    ).toBeOnTheScreen();
  });

  it('renders the remaining configuration values', async () => {
    await renderWithProviders(<App />);

    expect(screen.getByText('ar')).toBeOnTheScreen();
    expect(screen.getByText('15000 ms')).toBeOnTheScreen();
    expect(screen.getByText('disabled')).toBeOnTheScreen();
  });
});
