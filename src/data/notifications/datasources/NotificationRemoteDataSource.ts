import {
  markAllReadDtoSchema,
  notificationPageDtoSchema,
  type NotificationDto,
} from '@data/notifications/dto';
import { parseResponse } from '@data/shared';

import type { HttpClient } from '@infrastructure/http';

export class NotificationRemoteDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async list(page: number, size: number): Promise<readonly NotificationDto[]> {
    const endpoint = '/notifications';
    const response = await this.httpClient.request<unknown>({
      method: 'GET',
      endpoint,
      query: { page, size },
    });
    return parseResponse(
      notificationPageDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).content;
  }

  /**
   * Invented (FA1). The collection contracts reading notifications and nothing that marks one
   * read, so this route is specified in `INVENTED_ENDPOINTS.md` for the backend team. It is the
   * only write this data source makes.
   */
  async markAllRead(): Promise<number> {
    const endpoint = '/notifications/read-all';
    const response = await this.httpClient.request<unknown>({
      method: 'POST',
      endpoint,
    });
    return parseResponse(
      markAllReadDtoSchema,
      response.data,
      endpoint,
      response.correlationId,
    ).updated;
  }
}
