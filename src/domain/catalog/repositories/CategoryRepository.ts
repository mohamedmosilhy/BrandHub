import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { Category } from '@domain/catalog/entities';

export interface CategoryRepository {
  getTree(): Promise<Result<readonly Category[], AppError>>;
}
