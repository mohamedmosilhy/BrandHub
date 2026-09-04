import type { AddCartItem } from '@domain/cart';

import { cartDtoSchema, type CartDto } from '@data/cart/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class CartRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async get(): Promise<CartDto> {
    const endpoint = '/cart';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      cartDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async add(input: AddCartItem): Promise<CartDto> {
    const endpoint = '/cart/items';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: {
        productId: input.product.id,
        variantId: input.variant.id,
        quantity: input.quantity,
      },
    });
    return parseResponse(
      cartDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async update(lineId: string, quantity: number): Promise<CartDto> {
    const endpoint = `/cart/items/${encodeURIComponent(lineId)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'PUT',
      endpoint,
      query: { quantity },
    });
    return parseResponse(
      cartDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async remove(lineId: string): Promise<CartDto> {
    await this.httpClient.request<unknown>({
      method: 'DELETE',
      endpoint: `/cart/items/${encodeURIComponent(lineId)}`,
    });
    return this.get();
  }

  async clear(): Promise<void> {
    await this.httpClient.request<unknown>({
      method: 'DELETE',
      endpoint: '/cart',
    });
  }
}
