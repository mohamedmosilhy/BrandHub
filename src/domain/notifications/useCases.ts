import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type { AppNotification } from './entities';
import type { NotificationRepository } from './NotificationRepository';

export const DEFAULT_PAGE_SIZE = 20;

/**
 * D17 — notifications are an in-app list. There is no push delivery, no permission prompt and no
 * device token, so reading the list is the only way it ever changes: on open, and on refresh.
 */
export class GetNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}
  execute(
    page = 0,
    size = DEFAULT_PAGE_SIZE,
  ): Promise<Result<readonly AppNotification[], AppError>> {
    return this.repository.list(page, size);
  }
}

export class MarkAllReadUseCase {
  constructor(private readonly repository: NotificationRepository) {}
  execute(): Promise<Result<number, AppError>> {
    return this.repository.markAllRead();
  }
}
