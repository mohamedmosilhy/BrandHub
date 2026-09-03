import { sessionStore } from '@presentation/features/auth';

import { fireEvent, renderWithProviders, screen } from '@test/render';

import App from './App';

// App-shell tests exercise auth/navigation only; catalogue HTTP behavior has
// dedicated Phase 6 integration and screen suites.
jest.mock('@presentation/features/home', () => ({ HomeScreen: () => null }));

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

describe('App identity shell', () => {
  beforeEach(() => {
    sessionStore.setState({
      status: 'loading',
      session: null,
      onboardingComplete: false,
    });
  });

  it('shows onboarding after a cold start with no session', async () => {
    await renderWithProviders(<App />);
    expect(
      await screen.findByText('كل ما تحبه من متاجر عُمان في مكان واحد'),
    ).toBeOnTheScreen();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it('enters the five-tab shell as a guest while keeping cart public', async () => {
    await renderWithProviders(<App />);
    await fireEvent.press(await screen.findByLabelText('المتابعة كزائر'));
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.props['accessibilityLabel'])).toEqual([
      'الرئيسية',
      'الفئات',
      'المؤثرون',
      'العربة',
      'حسابي',
    ]);
  });

  it('opens email registration in the auth stack with sign-up active', async () => {
    await renderWithProviders(<App />);
    await fireEvent.press(await screen.findByLabelText('البريد الإلكتروني'));

    expect(await screen.findByText('أنشئ حسابك')).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'حساب جديد' }).props[
        'accessibilityState'
      ],
    ).toMatchObject({ selected: true });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});
