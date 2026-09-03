import { productListDtoSchema, type ProductDto } from '@data/catalog/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

/** `GET /wishlist` answers with the saved products, not with join rows. */
export class WishlistRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(): Promise<readonly ProductDto[]> {
    const endpoint = '/wishlist';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      productListDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async add(productId: string): Promise<void> {
    await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint: `/wishlist/${encodeURIComponent(productId)}`,
    });
  }

  async remove(productId: string): Promise<void> {
    await this.httpClient.request<unknown>({
      method: 'DELETE',
      endpoint: `/wishlist/${encodeURIComponent(productId)}`,
    });
  }
}
