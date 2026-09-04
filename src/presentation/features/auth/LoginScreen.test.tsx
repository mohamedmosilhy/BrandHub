import { err, ok } from '@core/result';

import {
  InvalidCredentialsError,
  SignInUseCase,
  SignUpUseCase,
  type AuthRepository,
} from '@domain/identity';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { LoginScreen } from './LoginScreen';

const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: {
    id: 'user-1',
    email: 'person@example.com',
    firstName: 'Sara',
    lastName: 'Ali',
    accountType: 'customer' as const,
  },
};

function authRepository(): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn(async (_input: Parameters<AuthRepository['signIn']>[0]) =>
      ok(session),
    ),
    signUp: jest.fn(async (_input: Parameters<AuthRepository['signUp']>[0]) =>
      ok({
        kind: 'sellerPendingApproval' as const,
        email: 'shop@example.com',
      }),
    ),
    signOut: jest.fn(async () => ok(undefined)),
    updateProfile: jest.fn(
      async (_input: Parameters<AuthRepository['updateProfile']>[0]) =>
        ok(session),
    ),
    restoreSession: jest.fn(async () => ok(null)),
    refreshSession: jest.fn(async () => ok(session)),
    sendPhoneOtp: jest.fn(
      async (_phone: Parameters<AuthRepository['sendPhoneOtp']>[0]) =>
        ok({ challengeId: 'otp-1', expiresInSeconds: 300 }),
    ),
    verifyPhoneOtp: jest.fn(
      async (
        _challengeId: Parameters<AuthRepository['verifyPhoneOtp']>[0],
        _code: Parameters<AuthRepository['verifyPhoneOtp']>[1],
      ) => ok(undefined),
    ),
  };
}

function subject(repo: AuthRepository, initialMode: 'signin' | 'signup') {
  return (
    <LoginScreen
      initialMode={initialMode}
      signIn={new SignInUseCase(repo)}
      signUp={new SignUpUseCase(repo)}
      onBack={jest.fn()}
      onUsePhone={jest.fn()}
      onAuthenticated={jest.fn()}
    />
  );
}

describe('LoginScreen', () => {
  it('blocks invalid email in the active language', async () => {
    const repo = authRepository();
    await renderWithProviders(subject(repo, 'signin'));
    await fireEvent.changeText(
      screen.getByTestId('auth-email'),
      'not-an-email',
    );
    await fireEvent.changeText(
      screen.getByTestId('auth-password'),
      'Password123!',
    );
    await fireEvent.press(screen.getByTestId('auth-submit'));

    expect(
      await screen.findByText('أدخل بريداً إلكترونياً صحيحاً'),
    ).toBeOnTheScreen();
    expect(repo.signIn).not.toHaveBeenCalled();
  });

  it('shows invalid credentials inline without authenticating', async () => {
    const repo = authRepository();
    repo.signIn.mockResolvedValueOnce(
      err(new InvalidCredentialsError('cor-login')),
    );
    const onAuthenticated = jest.fn();
    await renderWithProviders(
      <LoginScreen
        initialMode="signin"
        signIn={new SignInUseCase(repo)}
        signUp={new SignUpUseCase(repo)}
        onBack={jest.fn()}
        onUsePhone={jest.fn()}
        onAuthenticated={onAuthenticated}
      />,
    );
    await fireEvent.changeText(
      screen.getByTestId('auth-email'),
      'person@example.com',
    );
    await fireEvent.changeText(
      screen.getByTestId('auth-password'),
      'Password123!',
    );
    await fireEvent.press(screen.getByTestId('auth-submit'));

    expect(
      await screen.findByText('البريد الإلكتروني أو كلمة المرور غير صحيحة'),
    ).toBeOnTheScreen();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('switches password masking and the matching icon', async () => {
    await renderWithProviders(subject(authRepository(), 'signin'));
    expect(screen.getByTestId('auth-password').props['secureTextEntry']).toBe(
      true,
    );
    expect(screen.getByTestId('password-hidden-icon')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('password-visibility-toggle'));
    expect(screen.getByTestId('auth-password').props['secureTextEntry']).toBe(
      false,
    );
    expect(screen.getByTestId('password-visible-icon')).toBeOnTheScreen();
  });

  it('shows seller-only fields and submits pending without authentication', async () => {
    const repo = authRepository();
    const onAuthenticated = jest.fn();
    await renderWithProviders(
      <LoginScreen
        initialMode="signup"
        signIn={new SignInUseCase(repo)}
        signUp={new SignUpUseCase(repo)}
        onBack={jest.fn()}
        onUsePhone={jest.fn()}
        onAuthenticated={onAuthenticated}
      />,
    );
    await fireEvent.press(screen.getByLabelText('بائع'));
    expect(screen.getByText('اسم المتجر')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'حساب البائع يخضع لمراجعة الإدارة قبل تفعيل لوحة التحكم.',
      ),
    ).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('اسم المتجر'), 'A2 Store');
    await fireEvent.changeText(
      screen.getByTestId('auth-email'),
      'shop@example.com',
    );
    await fireEvent.changeText(
      screen.getByLabelText('رقم الهاتف (+968)'),
      '99112233',
    );
    await fireEvent.changeText(
      screen.getByTestId('auth-password'),
      'Password123!',
    );
    await fireEvent.press(screen.getByTestId('auth-submit'));

    await waitFor(() => expect(repo.signUp).toHaveBeenCalledTimes(1));
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(screen.getByText('تم إرسال حساب البائع للمراجعة')).toBeOnTheScreen();
  });
});
