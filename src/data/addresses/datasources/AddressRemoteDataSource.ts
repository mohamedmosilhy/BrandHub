import type { z } from 'zod';

import type { AddressInput } from '@domain/addresses';

import {
  shippingAreaListDtoSchema,
  type ShippingAreaDto,
} from '@data/checkout/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

import {
  addressDtoSchema,
  addressListDtoSchema,
  type AddressDto,
} from '../dto';
import { addressPayload } from '../mappers';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class AddressRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  private async parsed<T>(
    method: Method,
    endpoint: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const response = await this.httpClient.request<unknown>({
      method,
      endpoint,
      ...(body === undefined ? {} : { body }),
    });
    return parseResponse(
      schema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  list(): Promise<readonly AddressDto[]> {
    return this.parsed('GET', '/users/me/addresses', addressListDtoSchema);
  }

  get(id: string): Promise<AddressDto> {
    return this.parsed('GET', this.one(id), addressDtoSchema);
  }

  create(input: AddressInput): Promise<AddressDto> {
    return this.parsed(
      'POST',
      '/users/me/addresses',
      addressDtoSchema,
      addressPayload(input),
    );
  }

  update(id: string, input: AddressInput): Promise<AddressDto> {
    return this.parsed(
      'PUT',
      this.one(id),
      addressDtoSchema,
      addressPayload(input),
    );
  }

  async setDefault(id: string): Promise<void> {
    await this.httpClient.request({
      method: 'POST',
      endpoint: `${this.one(id)}/set-default`,
    });
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.request({ method: 'DELETE', endpoint: this.one(id) });
  }

  /**
   * Areas come from the same source as the addresses they resolve against, so an address is never
   * mapped with a stale area list. See `resolveAddressArea`.
   */
  listAreas(): Promise<readonly ShippingAreaDto[]> {
    return this.parsed('GET', '/areas', shippingAreaListDtoSchema);
  }

  private one(id: string): string {
    return `/users/me/addresses/${encodeURIComponent(id)}`;
  }
}
