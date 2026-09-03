import type { SearchCriteria } from '@domain/catalog';

import {
  productDtoSchema,
  productListDtoSchema,
  productPageDtoSchema,
  type ProductDto,
  type ProductPageDto,
} from '@data/catalog/dto';
import { criteriaToQueryParams } from '@data/catalog/queryParams';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class ProductRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  private async list(endpoint: string): Promise<readonly ProductDto[]> {
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

  getFeatured() {
    return this.list('/products/featured');
  }

  getBestSellers() {
    return this.list('/products/best-sellers');
  }

  getNewArrivals() {
    return this.list('/products/new-arrivals');
  }

  async getById(id: string): Promise<ProductDto> {
    const endpoint = `/products/${encodeURIComponent(id)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
    });
    return parseResponse(
      productDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async getRelated(id: string): Promise<readonly ProductDto[]> {
    const product = await this.getById(id);
    const page = await this.search({ categoryId: product.categoryId }, 0, 8);
    return page.content.filter((item) => item.id !== id).slice(0, 6);
  }

  async search(
    criteria: SearchCriteria,
    page: number,
    size: number,
  ): Promise<ProductPageDto> {
    const endpoint = '/search/products';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: criteriaToQueryParams(criteria, page, size),
    });
    return parseResponse(
      productPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }

  async getByCategory(
    categoryId: string,
    criteria: SearchCriteria,
    page: number,
    size: number,
  ): Promise<ProductPageDto> {
    const endpoint = `/products/category/${encodeURIComponent(categoryId)}`;
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: criteriaToQueryParams(criteria, page, size),
    });
    return parseResponse(
      productPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    );
  }
}
