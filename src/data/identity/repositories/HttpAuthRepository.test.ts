/** @jest-environment node */

import { NetworkError, UnauthorizedError } from '@core/errors';

import { createEmail, createPhoneNumber } from '@domain/identity';

import {
  AuthRemoteDataSource,
  SessionLocalDataSource,
} from '@data/identity/datasources';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';
import {
  SecureSessionStore,
  createSessionStateStore,
} from '@infrastructure/storage';

import { MemoryStorage } from '@test/doubles';

import { HttpAuthRepository } from './HttpAuthRepository';

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  readonly responses = new Map<string, unknown>();
  readonly failures = new Map<string, Error>();

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    const failure = this.failures.get(config.endpoint);
    if (failure) throw failure;
    return {
      data: this.responses.get(config.endpoint) as T,
      status: config.endpoint === '/auth/logout' ? 204 : 200,
      headers: {},
      correlationId: 'cor-auth',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const secure = new MemoryStorage();
  const tokens = new SecureSessionStore(secure, createSessionStateStore());
  const local = new SessionLocalDataSource(secure, tokens);
  const repository = new HttpAuthRepository(
    new AuthRemoteDataSource(http),
    local,
  );
  return { http, secure, local, repository };
}

const customerSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-1',
    email: 'customer@example.com',
    firstName: 'Sara',
    lastName: 'Ali',
    phone: '+96899112233',
    role: 'ROLE_CUSTOMER',
  },
};

function values() {
  const email = createEmail('customer@example.com');
  const phone = createPhoneNumber('+96899112233');
  if (!email.ok || !phone.ok) throw new Error('fixture invalid');
  return { email: email.value, phone: phone.value };
}

describe('HttpAuthRepository', () => {
  it('stores a successful sign-in and restores it after a restart', async () => {
    const { http, repository } = fixture();
    http.responses.set('/auth/login', customerSession);

    const signedIn = await repository.signIn({
      email: values().email,
      password: 'Password123!',
    });
    const restored = await repository.restoreSession();

    expect(signedIn.ok).toBe(true);
    expect(restored).toEqual(signedIn);
  });

  it('returns guest restoration when secure storage has no session', async () => {
    const { repository } = fixture();
    expect(await repository.restoreSession()).toEqual({
      ok: true,
      value: null,
    });
  });

  it('maps a login 401 to InvalidCredentials and preserves network errors', async () => {
    const { http, repository } = fixture();
    http.failures.set(
      '/auth/login',
      new UnauthorizedError({
        code: 'INVALID_CREDENTIALS',
        message: 'wrong',
        correlationId: 'cor-login',
      }),
    );
    const invalid = await repository.signIn({
      email: values().email,
      password: 'wrong-password',
    });
    expect(invalid.ok ? null : invalid.error.constructor.name).toBe(
      'InvalidCredentialsError',
    );

    http.failures.set(
      '/auth/login',
      new NetworkError({
        code: 'NETWORK_UNAVAILABLE',
        message: 'offline',
        correlationId: 'cor-network',
      }),
    );
    const offline = await repository.signIn({
      email: values().email,
      password: 'Password123!',
    });
    expect(offline.ok ? null : offline.error.code).toBe('NETWORK_UNAVAILABLE');
  });

  it('returns seller pending without storing a session', async () => {
    const { http, repository, local } = fixture();
    http.responses.set('/auth/register/seller', {
      success: true,
      data: {
        id: 'seller-1',
        email: 'customer@example.com',
        name: 'A2 Store',
        phoneNumber: '+96899112233',
        role: 'ROLE_SELLER',
        status: 'PENDING_APPROVAL',
      },
    });

    const result = await repository.signUp({
      ...values(),
      accountType: 'seller',
      name: 'A2 Store',
      password: 'Password123!',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        kind: 'sellerPendingApproval',
        email: 'customer@example.com',
      },
    });
    expect(await local.load()).toBeNull();
  });

  it('registers a customer, signs in, refreshes, and signs out securely', async () => {
    const { http, repository, local } = fixture();
    http.responses.set('/auth/register', {
      success: true,
      data: customerSession.user,
    });
    http.responses.set('/auth/login', customerSession);
    http.responses.set('/auth/refresh', { accessToken: 'rotated-access' });
    const input = {
      ...values(),
      accountType: 'customer' as const,
      name: 'Sara Ali',
      password: 'Password123!',
    };

    const registered = await repository.signUp(input);
    const refreshed = await repository.refreshSession();
    const signedOut = await repository.signOut();

    expect(registered.ok && registered.value.kind).toBe('authenticated');
    expect(refreshed.ok && refreshed.value.accessToken).toBe('rotated-access');
    expect(signedOut).toEqual({ ok: true, value: undefined });
    expect(await local.load()).toBeNull();
    expect(http.requests.map((item) => item.endpoint)).toEqual([
      '/auth/register',
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
    ]);
  });

  it('completes the explicitly mock-only OTP pair', async () => {
    const { http, repository } = fixture();
    http.responses.set('/auth/phone/send-otp', {
      success: true,
      data: { challengeId: 'otp-1', expiresInSeconds: 300 },
    });
    http.responses.set('/auth/phone/verify-otp', {
      success: true,
      data: { verified: true, phone: '+96899112233' },
    });
    expect(await repository.sendPhoneOtp(values().phone)).toEqual({
      ok: true,
      value: { challengeId: 'otp-1', expiresInSeconds: 300 },
    });
    expect(await repository.verifyPhoneOtp('otp-1', '123456')).toEqual({
      ok: true,
      value: undefined,
    });
  });
});
