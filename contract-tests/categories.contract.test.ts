/** @jest-environment node */

import request from 'supertest';

import { categoryTreeDtoSchema } from '@data/catalog/dto';
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
});
