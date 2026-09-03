import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import type { WishlistRepository } from '@domain/wishlist';

import {
  mapProduct,
  type AssetUrlResolver,
} from '@data/catalog/mappers/productMapper';
import type { WishlistRemoteDataSource } from '@data/wishlist/datasources';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpWishlistRepository implements WishlistRepository {
  constructor(
    private readonly remote: WishlistRemoteDataSource,
    private readonly resolveUrl?: AssetUrlResolver,
  ) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async list() {
    try {
      const products = await this.remote.list();
      return ok(
        products.map((dto) => {
          const product = mapProduct(dto, this.resolveUrl);
          return { productId: product.id, product };
        }),
      );
    } catch (error) {
      return this.failure(error);
    }
  }

  async add(productId: string) {
    try {
      await this.remote.add(productId);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }

  async remove(productId: string) {
    try {
      await this.remote.remove(productId);
      return ok(undefined);
    } catch (error) {
      return this.failure(error);
    }
  }
}
