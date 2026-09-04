import { ok } from '@core/result';

import type { AuthRepository } from './AuthRepository';
import { InvalidCredentialsError } from './errors';
import {
  UpdateProfileUseCase,
  PhoneOtpUseCase,
  RefreshSessionUseCase,
  RestoreSessionUseCase,
  SignInUseCase,
  SignOutUseCase,
  SignUpUseCase,
} from './useCases';
import { createEmail, createPhoneNumber } from './valueObjects';

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

function repository(): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn(async (_input: Parameters<AuthRepository['signIn']>[0]) =>
      ok(session),
    ),
    signUp: jest.fn(async (_input: Parameters<AuthRepository['signUp']>[0]) =>
      ok({ kind: 'authenticated' as const, session }),
    ),
    signOut: jest.fn(async () => ok(undefined)),
    updateProfile: jest.fn(
      async (_input: Parameters<AuthRepository['updateProfile']>[0]) =>
        ok(session),
    ),
    restoreSession: jest.fn(async () => ok(session)),
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

describe('identity value objects', () => {
  it('normalizes valid email and Oman phone values', () => {
    expect(createEmail(' PERSON@Example.COM ')).toEqual({
      ok: true,
      value: 'person@example.com',
    });
    expect(createPhoneNumber('+968 9911-2233')).toEqual({
      ok: true,
      value: '+96899112233',
    });
  });

  it('returns named domain errors for invalid values', () => {
    const email = createEmail('invalid');
    const phone = createPhoneNumber('9911');
    expect(email.ok ? null : email.error.code).toBe('INVALID_EMAIL');
    expect(phone.ok ? null : phone.error.code).toBe('INVALID_PHONE');
    expect(new InvalidCredentialsError('cor-1').code).toBe(
      'INVALID_CREDENTIALS',
    );
  });
});

describe('identity use cases', () => {
  it('delegates each operation through the narrow auth port', async () => {
    const repo = repository();
    const email = createEmail('person@example.com');
    const phone = createPhoneNumber('+96899112233');
    if (!email.ok || !phone.ok) throw new Error('fixture invalid');
    const signInInput = { email: email.value, password: 'Password123!' };
    const signUpInput = {
      ...signInInput,
      accountType: 'customer' as const,
      name: 'Sara Ali',
      phone: phone.value,
    };

    await new SignInUseCase(repo).execute(signInInput);
    await new SignUpUseCase(repo).execute(signUpInput);
    await new SignOutUseCase(repo).execute();
    await new RestoreSessionUseCase(repo).execute();
    await new RefreshSessionUseCase(repo).execute();
    const otp = new PhoneOtpUseCase(repo);
    await otp.send(phone.value);
    await otp.verify('otp-1', '123456');

    expect(repo.signIn).toHaveBeenCalledWith(signInInput);
    expect(repo.signUp).toHaveBeenCalledWith(signUpInput);
    expect(repo.signOut).toHaveBeenCalledTimes(1);
    expect(repo.restoreSession).toHaveBeenCalledTimes(1);
    expect(repo.refreshSession).toHaveBeenCalledTimes(1);
    expect(repo.sendPhoneOtp).toHaveBeenCalledWith(phone.value);
    expect(repo.verifyPhoneOtp).toHaveBeenCalledWith('otp-1', '123456');
  });
});

describe('UpdateProfileUseCase', () => {
  const input = {
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'Person@Example.com',
    phone: '+968 9911 2233',
  };

  it('saves a valid profile with the email and phone normalised', async () => {
    const repo = repository();

    const result = await new UpdateProfileUseCase(repo).execute(input);

    expect(result.ok).toBe(true);
    expect(repo.updateProfile).toHaveBeenCalledWith({
      firstName: 'Sara',
      lastName: 'Ali',
      email: 'person@example.com',
      phone: '+96899112233',
    });
  });

  it.each([
    [{ firstName: '  ' }, 'NAME_REQUIRED'],
    [{ lastName: '' }, 'NAME_REQUIRED'],
    [{ email: 'not-an-email' }, 'INVALID_EMAIL'],
    [{ phone: '0501234567' }, 'INVALID_PHONE'],
  ])('rejects %p and never reaches the repository', async (patch, code) => {
    const repo = repository();

    const result = await new UpdateProfileUseCase(repo).execute({
      ...input,
      ...patch,
    });

    expect(result.ok || result.error.code).toBe(code);
    expect(repo.updateProfile).not.toHaveBeenCalled();
  });
});
