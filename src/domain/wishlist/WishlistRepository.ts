import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { WishlistItem } from './entities';

export interface WishlistRepository {
  list(): Promise<Result<readonly WishlistItem[], AppError>>;
  add(productId: string): Promise<Result<void, AppError>>;
  remove(productId: string): Promise<Result<void, AppError>>;
}
