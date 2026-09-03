import {
  AxiosError,
  AxiosHeaders,
  create as createAxios,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { IdempotencyKey } from '@core/types';
import { IdempotencyAttempt } from '@core/types';

import type {
  SessionTokens,
  SessionStatus,
  TokenStore,
} from '@infrastructure/storage';

import { AxiosHttpClient } from './AxiosHttpClient';

class MemoryTokenStore implements TokenStore {
  tokens: SessionTokens | null;
  status: SessionStatus;
  clearCount = 0;

  constructor(tokens: SessionTokens | null) {
    this.tokens = tokens;
    this.status = tokens ? 'authenticated' : 'unauthenticated';
  }

  async getAccessToken() {
    return this.tokens?.accessToken ?? null;
  }

  async getRefreshToken() {
    return this.tokens?.refreshToken ?? null;
  }

  async saveTokens(tokens: SessionTokens) {
    this.tokens = tokens;
    this.status = 'authenticated';
  }

  async clearSession() {
    this.tokens = null;
    this.status = 'unauthenticated';
    this.clearCount += 1;
  }

  getStatus() {
    return this.status;
  }
}

function success(
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config,
  };
}

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
  return new AxiosError('Unauthorized', 'ERR_BAD_RESPONSE', config, undefined, {
    data: { code: 'UNAUTHORIZED' },
    status: 401,
    statusText: 'Unauthorized',
    headers: new AxiosHeaders(),
    config,
  });
}

describe('AxiosHttpClient', () => {
  it('adds auth, locale, correlation and idempotency headers and omits absent auth', async () => {
    const seen: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      seen.push(config);
      return success(config, { ok: true });
    };
    const tokenStore = new MemoryTokenStore({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const client = new AxiosHttpClient({
      baseUrl: 'https://api.brandhub.test/api/v1',
      timeoutMs: 15_000,
      tokenStore,
      localeProvider: () => 'ar',
      correlationIdFactory: () => 'cor-fixed',
      transport: createAxios({ adapter }),
      refreshTransport: createAxios({ adapter }),
    });

    await client.request({
      method: 'POST',
      endpoint: '/orders',
      idempotencyKey: 'attempt-1' as IdempotencyKey,
    });
    tokenStore.tokens = null;
    await client.request({ method: 'GET', endpoint: '/products' });

    expect(seen[0]?.headers.get('Authorization')).toBe('Bearer access');
    expect(seen[0]?.headers.get('Accept-Language')).toBe('ar');
    expect(seen[0]?.headers.get('X-Correlation-ID')).toBe('cor-fixed');
    expect(seen[0]?.headers.get('Idempotency-Key')).toBe('attempt-1');
    expect(seen[1]?.headers.has('Authorization')).toBe(false);
  });

  it('single-flights refresh for three concurrent 401 responses', async () => {
    let refreshCount = 0;
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return success(config, { accessToken: 'fresh-access' });
      }
      if (config.headers.get('Authorization') === 'Bearer expired-access') {
        throw unauthorized(config);
      }
      return success(config, { value: config.url });
    };
    const tokenStore = new MemoryTokenStore({
      accessToken: 'expired-access',
      refreshToken: 'valid-refresh',
    });
    const client = new AxiosHttpClient({
      baseUrl: 'https://api.brandhub.test/api/v1',
      timeoutMs: 15_000,
      tokenStore,
      localeProvider: () => 'en',
      transport: createAxios({ adapter }),
      refreshTransport: createAxios({ adapter }),
    });

    const responses = await Promise.all([
      client.request({ method: 'GET', endpoint: '/one' }),
      client.request({ method: 'GET', endpoint: '/two' }),
      client.request({ method: 'GET', endpoint: '/three' }),
    ]);

    expect(responses).toHaveLength(3);
    expect(refreshCount).toBe(1);
    expect(tokenStore.tokens).toEqual({
      accessToken: 'fresh-access',
      refreshToken: 'valid-refresh',
    });
  });

  it('sends one attempt key across retries and a different key for a fresh attempt', async () => {
    const keys: string[] = [];
    const adapter: AxiosAdapter = async (config) => {
      keys.push(String(config.headers.get('Idempotency-Key')));
      return success(config, { ok: true });
    };
    const client = new AxiosHttpClient({
      baseUrl: 'https://api.brandhub.test/api/v1',
      timeoutMs: 15_000,
      tokenStore: new MemoryTokenStore(null),
      localeProvider: () => 'en',
      transport: createAxios({ adapter }),
    });
    let sequence = 0;
    const factory = () => `attempt-${++sequence}` as IdempotencyKey;
    const attempt = IdempotencyAttempt.start(factory);
    const freshAttempt = IdempotencyAttempt.start(factory);

    await client.request({
      method: 'POST',
      endpoint: '/orders',
      idempotencyKey: attempt.key,
    });
    await client.request({
      method: 'POST',
      endpoint: '/orders',
      idempotencyKey: attempt.key,
    });
    await client.request({
      method: 'POST',
      endpoint: '/orders',
      idempotencyKey: freshAttempt.key,
    });

    expect(keys).toEqual(['attempt-1', 'attempt-1', 'attempt-2']);
  });

  it('clears the session when refresh fails', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw unauthorized(config);
    };
    const tokenStore = new MemoryTokenStore({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    });
    const client = new AxiosHttpClient({
      baseUrl: 'https://api.brandhub.test/api/v1',
      timeoutMs: 15_000,
      tokenStore,
      localeProvider: () => 'en',
      transport: createAxios({ adapter }),
      refreshTransport: createAxios({ adapter }),
    });

    await expect(
      client.request({ method: 'GET', endpoint: '/protected' }),
    ).rejects.toMatchObject({
      status: 401,
    });
    expect(tokenStore.clearCount).toBe(1);
    expect(tokenStore.getStatus()).toBe('unauthenticated');
  });
});
