import {
  categoryDtoSchema,
  categoryTreeDtoSchema,
  type CategoryDto,
} from '@data/catalog/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

const CATEGORY_TREE_ENDPOINT = '/categories/tree';

export class CategoryRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async getTree(): Promise<readonly CategoryDto[]> {
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint: CATEGORY_TREE_ENDPOINT,
    });
    return parseResponse(
      categoryTreeDtoSchema,
      response.data,
      CATEGORY_TREE_ENDPOINT,
      response.correlationId,
    );
  }

  async getById(id: string): Promise<CategoryDto> {
    const endpoint = `/categories/${encodeURIComponent(id)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      categoryDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
