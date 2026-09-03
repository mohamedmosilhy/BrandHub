import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Product, Seller } from '@domain/catalog/entities';
import type { Page } from '@domain/catalog/SearchCriteria';

/**
 * The contract exposes `GET /sellers`, `GET /sellers/{id}/products` and the profile image, but
 * no `GET /sellers/{id}`. `getById` is therefore a data-layer lookup over the seller page rather
 * than a request of its own; the port stays the shape the seller store screen needs, so a real
 * single-seller endpoint later is a change in one implementation.
 */
export interface SellerRepository {
  getById(id: string): Promise<Result<Seller, AppError>>;
  getProducts(
    id: string,
    page: number,
    size?: number,
  ): Promise<Result<Page<Product>, AppError>>;
}
