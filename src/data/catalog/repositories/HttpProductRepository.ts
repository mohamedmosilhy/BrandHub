import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { ProductRepository, SearchCriteria } from '@domain/catalog';

import { ProductRemoteDataSource } from '@data/catalog/datasources';
import {
  mapProduct,
  mapProductPage,
  type AssetUrlResolver,
} from '@data/catalog/mappers/productMapper';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpProductRepository implements ProductRepository {
  constructor(
    private readonly remote: ProductRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async search(criteria: SearchCriteria, page: number, size = 20) {
    try {
      return ok(
        mapProductPage(
          await this.remote.search(criteria, page, size),
          this.resolveUrl,
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getById(id: string) {
    try {
      return ok(mapProduct(await this.remote.getById(id), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async getRelated(id: string) {
    try {
      return ok(
        (await this.remote.getRelated(id)).map((item) =>
          mapProduct(item, this.resolveUrl),
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getByCategory(
    categoryId: string,
    page: number,
    criteria: SearchCriteria = {},
    size = 20,
  ) {
    try {
      return ok(
        mapProductPage(
          await this.remote.getByCategory(categoryId, criteria, page, size),
          this.resolveUrl,
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getBestSellers() {
    try {
      return ok(
        (await this.remote.getBestSellers()).map((item) =>
          mapProduct(item, this.resolveUrl),
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getNewArrivals() {
    try {
      return ok(
        (await this.remote.getNewArrivals()).map((item) =>
          mapProduct(item, this.resolveUrl),
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async getFeatured() {
    try {
      return ok(
        (await this.remote.getFeatured()).map((item) =>
          mapProduct(item, this.resolveUrl),
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }
}
