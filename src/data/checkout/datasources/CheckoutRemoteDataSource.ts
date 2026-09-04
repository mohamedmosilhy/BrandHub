import type { NewShippingAddress } from '@domain/checkout';

import {
  couponValidationDtoSchema,
  shippingAddressListDtoSchema,
  shippingAreaListDtoSchema,
  type CouponDto,
  type ShippingAddressDto,
  type ShippingAreaDto,
} from '@data/checkout/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class CheckoutRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async validateCoupon(code: string): Promise<CouponDto> {
    const endpoint = '/coupons/validate';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: { code },
    });
    return parseResponse(
      couponValidationDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).coupon;
  }

  async listAreas(): Promise<readonly ShippingAreaDto[]> {
    const endpoint = '/areas';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      shippingAreaListDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async listAddresses(): Promise<readonly ShippingAddressDto[]> {
    const endpoint = '/users/me/addresses';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      shippingAddressListDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async saveAddress(input: NewShippingAddress): Promise<ShippingAddressDto> {
    const endpoint = '/users/me/addresses';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
      body: {
        ...input,
        addressLine2: null,
        state: null,
        postalCode: null,
        country: 'OM',
        isDefault: false,
      },
    });
    return parseResponse(
      shippingAddressListDtoSchema.element,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
