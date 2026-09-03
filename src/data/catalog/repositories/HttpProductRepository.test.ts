/** @jest-environment node */

import { rest } from 'msw';

import { Money } from '@core/money';

import { ProductRemoteDataSource } from '@data/catalog/datasources';

import { AxiosHttpClient } from '@infrastructure/http';
import type { TokenStore } from '@infrastructure/storage';

import { mockApiBaseUrl, mockApiServer } from '@test/msw';

import { HttpProductRepository } from './HttpProductRepository';

const emptyTokenStore: TokenStore = {
  getAccessToken: async () => null,
  getRefreshToken: async () => null,
  saveTokens: async () => undefined,
  clearSession: async () => undefined,
  getStatus: () => 'unauthenticated',
};

const productDto = {
  id: 'product-1',
  slug: 'headphones-1',
  categoryId: 'cat-electronics',
  sellerId: 'seller-a2',
  name: 'Headphones',
  description: 'Quiet',
  basePrice: 25,
  salePrice: 19.9,
  currency: 'OMR',
  stock: 9,
  featured: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  salesCount: 10,
  averageRating: 4.8,
  reviewCount: 42,
  images: [{ id: 'image-1', url: '/image.png', alt: 'Headphones' }],
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-1',
      attributes: { colour: 'Black' },
      stock: 9,
      price: 19.9,
    },
  ],
  specs: [],
};

function repository() {
  const http = new AxiosHttpClient({
    baseUrl: mockApiBaseUrl,
    timeoutMs: 15_000,
    tokenStore: emptyTokenStore,
    localeProvider: () => 'en',
    correlationIdFactory: () => 'cor-products',
  });
  return new HttpProductRepository(new ProductRemoteDataSource(http));
}

beforeAll(() => mockApiServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockApiServer.resetHandlers());
afterAll(() => mockApiServer.close());

describe('HttpProductRepository integration', () => {
  it('searches via HTTP, validates the page and maps entities', async () => {
    mockApiServer.use(
      rest.get(
        `${mockApiBaseUrl}/search/products`,
        (request, response, context) => {
          expect(request.url.searchParams.get('q')).toBe('headphones');
          expect(request.url.searchParams.get('sort')).toBe('price-asc');
          return response(
            context.set('x-correlation-id', 'cor-products'),
            context.json({
              content: [productDto],
              totalElements: 1,
              totalPages: 1,
              number: 0,
              size: 20,
              first: true,
              last: true,
            }),
          );
        },
      ),
    );
    const result = await repository().search(
      {
        query: 'headphones',
        sort: 'price-asc',
        minPrice: Money.fromDecimal(10),
      },
      0,
    );
    expect(result.ok && result.value.items[0]?.title).toBe('Headphones');
    expect(result.ok && result.value.hasNext).toBe(false);
  });

  it('maps HTTP 500 to ServerError', async () => {
    mockApiServer.use(
      rest.get(
        `${mockApiBaseUrl}/search/products`,
        (_request, response, context) =>
          response(context.status(500), context.json({ message: 'failed' })),
      ),
    );
    const result = await repository().search({ query: 'headphones' }, 0);
    expect(result.ok ? null : result.error.constructor.name).toBe(
      'ServerError',
    );
  });

  it('returns an empty page as content rather than an error', async () => {
    mockApiServer.use(
      rest.get(
        `${mockApiBaseUrl}/search/products`,
        (_request, response, context) =>
          response(
            context.json({
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0,
              size: 20,
              first: true,
              last: true,
            }),
          ),
      ),
    );
    await expect(repository().search({ query: 'missing' }, 0)).resolves.toEqual(
      {
        ok: true,
        value: { items: [], page: 0, size: 20, total: 0, hasNext: false },
      },
    );
  });
});
