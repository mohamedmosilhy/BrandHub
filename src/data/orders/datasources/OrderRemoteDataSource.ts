import type { IdempotencyKey } from '@core/types';

import type { CheckoutDraft } from '@domain/checkout';

import { orderDtoSchema, type OrderDto } from '@data/orders/dto';
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
}
