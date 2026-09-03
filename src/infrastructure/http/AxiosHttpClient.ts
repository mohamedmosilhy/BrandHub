import {
  AxiosHeaders,
  create as createAxios,
  isAxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { TokenStore } from '@infrastructure/storage';

import { createCorrelationId, type CorrelationIdFactory } from './correlation';
import { normalizeHttpError } from './errors';
import type { HttpClient, HttpResponse, RequestConfig } from './HttpClient';

type RetriableConfig = InternalAxiosRequestConfig & {
  __brandhubRetried?: boolean;
};

export type LocaleProvider = () => string | Promise<string>;

export type AxiosHttpClientOptions = Readonly<{
  baseUrl: string;
  timeoutMs: number;
  tokenStore: TokenStore;
  localeProvider: LocaleProvider;
  correlationIdFactory?: CorrelationIdFactory;
  transport?: AxiosInstance;
  refreshTransport?: AxiosInstance;
}>;

function responseHeaders(response: AxiosResponse): Record<string, string> {
  return Object.fromEntries(
    Object.entries(response.headers).map(([key, value]) => [
      key,
      String(value),
    ]),
  );
}

function tokenPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const data = record['data'];
  return record['success'] === true && data && typeof data === 'object'
    ? (data as Record<string, unknown>)
    : record;
}

export class AxiosHttpClient implements HttpClient {
  private readonly client: AxiosInstance;
  private readonly refreshClient: AxiosInstance;
  private readonly correlationIdFactory: CorrelationIdFactory;
  private refreshPromise: Promise<void> | null = null;

  constructor(private readonly options: AxiosHttpClientOptions) {
    this.correlationIdFactory =
      options.correlationIdFactory ?? createCorrelationId;
    this.client = options.transport ?? createAxios();
    this.refreshClient = options.refreshTransport ?? createAxios();
    for (const client of [this.client, this.refreshClient]) {
      client.defaults.baseURL = options.baseUrl;
      client.defaults.timeout = options.timeoutMs;
    }
    this.installInterceptors();
  }

  private installInterceptors(): void {
    this.client.interceptors.request.use(async (config) => {
      const headers = AxiosHeaders.from(config.headers);
      const [accessToken, locale] = await Promise.all([
        this.options.tokenStore.getAccessToken(),
        this.options.localeProvider(),
      ]);
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      else headers.delete('Authorization');
      headers.set('Accept-Language', locale);
      if (!headers.has('X-Correlation-ID')) {
        headers.set('X-Correlation-ID', this.correlationIdFactory());
      }
      config.headers = headers;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (source: unknown) => {
        if (isAxiosError(source)) {
          const original = source.config as RetriableConfig | undefined;
          if (
            source.response?.status === 401 &&
            original &&
            !original.__brandhubRetried &&
            !original.url?.endsWith('/auth/refresh')
          ) {
            original.__brandhubRetried = true;
            try {
              await this.refreshSingleFlight();
              return await this.client.request(original);
            } catch {
              // The original 401 is normalized below after refresh clears session.
            }
          }
        }
        throw normalizeHttpError(source, this.correlationIdFactory);
      },
    );
  }

  private refreshSingleFlight(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshTokens()
        .catch(async (error: unknown) => {
          await this.options.tokenStore.clearSession();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private async refreshTokens(): Promise<void> {
    const refreshToken = await this.options.tokenStore.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token is available');
    const response = await this.refreshClient.post<unknown>('/auth/refresh', {
      refreshToken,
    });
    const payload = tokenPayload(response.data);
    const accessToken = payload['accessToken'];
    const rotatedRefreshToken = payload['refreshToken'];
    if (typeof accessToken !== 'string') {
      throw new Error('Refresh response did not contain an access token');
    }
    await this.options.tokenStore.saveTokens({
      accessToken,
      refreshToken:
        typeof rotatedRefreshToken === 'string'
          ? rotatedRefreshToken
          : refreshToken,
    });
  }

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.client.request<T>({
        method: config.method,
        url: config.endpoint,
        ...(config.query ? { params: config.query } : {}),
        ...(config.body !== undefined ? { data: config.body } : {}),
        headers: {
          ...config.headers,
          ...(config.idempotencyKey
            ? { 'Idempotency-Key': config.idempotencyKey }
            : {}),
        },
        ...(config.signal ? { signal: config.signal } : {}),
      });
      const headers = responseHeaders(response);
      return {
        data: response.data,
        status: response.status,
        headers,
        correlationId:
          headers['x-correlation-id'] ??
          String(response.config.headers.get('X-Correlation-ID')),
      };
    } catch (source) {
      throw normalizeHttpError(source, this.correlationIdFactory);
    }
  }
}
