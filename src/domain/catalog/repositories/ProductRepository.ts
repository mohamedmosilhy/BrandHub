import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Product } from '@domain/catalog/entities';
import type { Page, SearchCriteria } from '@domain/catalog/SearchCriteria';

export interface ProductRepository {
  search(
    criteria: SearchCriteria,
    page: number,
    size?: number,
  ): Promise<Result<Page<Product>, AppError>>;
  getById(id: string): Promise<Result<Product, AppError>>;
  getRelated(id: string): Promise<Result<readonly Product[], AppError>>;
  getByCategory(
    categoryId: string,
    page: number,
    criteria?: SearchCriteria,
    size?: number,
  ): Promise<Result<Page<Product>, AppError>>;
  getBestSellers(): Promise<Result<readonly Product[], AppError>>;
  getNewArrivals(): Promise<Result<readonly Product[], AppError>>;
  getFeatured(): Promise<Result<readonly Product[], AppError>>;
}
