/** @jest-environment node */

import { CategoryRemoteDataSource } from '@data/catalog/datasources';

import { AxiosHttpClient } from '@infrastructure/http';
import type { TokenStore } from '@infrastructure/storage';

import { mockApiBaseUrl, mockApiServer } from '@test/msw';

import { CategoryRepositoryImpl } from './CategoryRepositoryImpl';

const emptyTokenStore: TokenStore = {
  getAccessToken: async () => null,
  getRefreshToken: async () => null,
  saveTokens: async () => undefined,
  clearSession: async () => undefined,
  getStatus: () => 'unauthenticated',
};

beforeAll(() => mockApiServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockApiServer.resetHandlers());
afterAll(() => mockApiServer.close());

describe('CategoryRepositoryImpl integration', () => {
  it('maps the MSW contract response through HTTP, DTO validation and the repository', async () => {
    const httpClient = new AxiosHttpClient({
      baseUrl: mockApiBaseUrl,
      timeoutMs: 15_000,
      tokenStore: emptyTokenStore,
      localeProvider: () => 'en',
      correlationIdFactory: () => 'cor-integration',
    });
    const repository = new CategoryRepositoryImpl(
      new CategoryRemoteDataSource(httpClient),
    );

    const result = await repository.getTree();

    expect(result).toEqual({
      ok: true,
      value: [
        expect.objectContaining({
          id: 'cat-electronics',
          title: 'Electronics',
          children: [expect.objectContaining({ title: 'Audio' })],
        }),
      ],
    });
  });
});
