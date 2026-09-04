import type { IdempotencyKey } from '@core/types';

import type { CheckoutDraft } from '@domain/checkout';

import {
  orderDtoSchema,
  orderPageDtoSchema,
  returnRequestDtoSchema,
  type OrderDto,
  type ReturnRequestDto,
} from '@data/orders/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class OrderRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async place(
    draft: CheckoutDraft,
    idempotencyKey: IdempotencyKey,
  ): Promise<OrderDto> {
    const endpoint = '/orders';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      idempotencyKey,
      body: {
        shippingAddressId: draft.shippingAddressId,
        ...(draft.coupon ? { couponCode: draft.coupon.code } : {}),
        paymentMethod: draft.paymentMethod,
        walletPayment: false,
      },
    });
    return parseResponse(
      orderDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async getById(id: string): Promise<OrderDto> {
    const endpoint = `/orders/${encodeURIComponent(id)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      orderDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async list(page: number, size: number): Promise<readonly OrderDto[]> {
    const endpoint = '/orders';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      orderPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  /** The real contract (D19): `POST /returns` takes `{ orderId, reason }` and nothing else. */
  async requestReturn(
    orderId: string,
    reason: string,
  ): Promise<ReturnRequestDto> {
    const endpoint = '/returns';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { orderId, reason },
    });
    return parseResponse(
      returnRequestDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
