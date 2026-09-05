import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  DEFAULT_PAGE_SIZE,
  type NotificationRepository,
} from '@domain/notifications';

import type { NotificationRemoteDataSource } from '@data/notifications/datasources';
import { mapNotification } from '@data/notifications/mappers';

import { normalizeHttpError } from '@infrastructure/http';

/**
 * Reading is contracted, so this repository is `Http` rather than `Mock`. Its one write —
 * `markAllRead` — is the invented route the prototype's mark-all-read action needs; it is
 * documented as provisional in `INVENTED_ENDPOINTS.md` and confined to the data source.
 */
export class HttpNotificationRepository implements NotificationRepository {
  constructor(private readonly remote: NotificationRemoteDataSource) {}

  private failure(error: unknown) {
    return err(isAppError(error) ? error : normalizeHttpError(error));
  }

  async list(page = 0, size = DEFAULT_PAGE_SIZE) {
    try {
      const notifications = await this.remote.list(page, size);
      return ok(notifications.map(mapNotification));
    } catch (error) {
      return this.failure(error);
    }
  }

  async markAllRead() {
    try {
      return ok(await this.remote.markAllRead());
    } catch (error) {
      return this.failure(error);
    }
  }
}
