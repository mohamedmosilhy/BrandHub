import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { SellerRepository } from '@domain/catalog';

import type { SellerRemoteDataSource } from '@data/catalog/datasources';
import {
  mapProductPage,
  mapSeller,
  type AssetUrlResolver,
} from '@data/catalog/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpSellerRepository implements SellerRepository {
  constructor(
    private readonly remote: SellerRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async getById(id: string) {
    try {
      return ok(mapSeller(await this.remote.getById(id), this.resolveUrl));
    } catch (error) {
      return this.failure(error);
    }
  }

  async getProducts(id: string, page: number, size = 20) {
    try {
      return ok(
        mapProductPage(
          await this.remote.getProducts(id, page, size),
          this.resolveUrl,
        ),
      );
    } catch (error) {
      return this.failure(error);
    }
  }
}
