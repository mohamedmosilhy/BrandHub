/** @jest-environment node */

import request from 'supertest';

import { categoryTreeDtoSchema, productPageDtoSchema } from '@data/catalog/dto';
import { parseResponse } from '@data/shared';

import { createMockApp } from '../mock-server/app';

describe('live mock category contract', () => {
  it('validates GET /categories/tree against the app DTO schema', async () => {
    const response = await request(createMockApp({ defaultLatencyMs: 0 }))
      .get('/api/v1/categories/tree')
      .set('Accept-Language', 'en');

    expect(response.status).toBe(200);
    const categories = parseResponse(
      categoryTreeDtoSchema,
      response.body,
      '/categories/tree',
      'contract-test',
    );
    expect(categories).toHaveLength(4);
  });

  it('validates paginated search results against the product DTO schema', async () => {
    const response = await request(createMockApp({ defaultLatencyMs: 0 }))
      .get('/api/v1/search/products?q=headphones&page=0&size=5')
      .set('Accept-Language', 'en');

    expect(response.status).toBe(200);
    const page = parseResponse(
      productPageDtoSchema,
      response.body,
      '/search/products',
      'contract-test',
    );
    expect(page.content).toHaveLength(5);
    expect(page.content[0]).toEqual(
      expect.objectContaining({
        name: expect.stringContaining('headphones'),
        averageRating: expect.any(Number),
        reviewCount: expect.any(Number),
      }),
    );
  });
});
