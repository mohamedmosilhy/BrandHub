import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { AppNotification } from './entities';

export interface NotificationRepository {
  list(
    page?: number,
    size?: number,
  ): Promise<Result<readonly AppNotification[], AppError>>;
  /** Resolves to the number of rows that changed, so a no-op is distinguishable from a change. */
  markAllRead(): Promise<Result<number, AppError>>;
}
