import { NotFoundError } from '@core/errors';

import {
  productPageDtoSchema,
  sellerPageDtoSchema,
  type ProductPageDto,
  type SellerDto,
} from '@data/catalog/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

/** Large enough to hold the whole seller directory in one request; see `SellerRepository`. */
const SELLER_DIRECTORY_SIZE = 100;

export class SellerRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * The contract has no `GET /sellers/{id}`, so the directory page is searched instead. The
   * lookup is contained here: a real single-seller endpoint later replaces this method only.
   */
  async getById(id: string): Promise<SellerDto> {
    const endpoint = '/sellers';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page: 0, size: SELLER_DIRECTORY_SIZE },
    });
    const page = parseResponse(
      sellerPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
    const seller = page.content.find((item) => item.id === id);
    if (seller) return seller;
    throw new NotFoundError({
      code: 'SELLER_NOT_FOUND',
      message: `Seller ${id} is not in the seller directory`,
      correlationId: response.correlationId,
    });
  }

  async getProducts(
    id: string,
    page: number,
    size: number,
  ): Promise<ProductPageDto> {
    const endpoint = `/sellers/${encodeURIComponent(id)}/products`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      productPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
