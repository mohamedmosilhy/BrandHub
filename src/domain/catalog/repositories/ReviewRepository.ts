import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Review } from '@domain/catalog/entities';
import type { Page } from '@domain/catalog/SearchCriteria';

export interface ReviewRepository {
  listByProduct(
    productId: string,
    page: number,
    size?: number,
  ): Promise<Result<Page<Review>, AppError>>;
}
