import { reviewPageDtoSchema, type ReviewPageDto } from '@data/catalog/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class ReviewRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async listByProduct(
    productId: string,
    page: number,
    size: number,
  ): Promise<ReviewPageDto> {
    const endpoint = `/reviews/product/${encodeURIComponent(productId)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      reviewPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
