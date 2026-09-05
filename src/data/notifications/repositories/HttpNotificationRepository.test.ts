/** @jest-environment node */

import { UnauthorizedError } from '@core/errors';

import type { NotificationDto } from '@data/notifications/dto';

import type {
  HttpClient,
  HttpResponse,
  RequestConfig,
} from '@infrastructure/http';

import { NotificationRemoteDataSource } from '../datasources';

import { HttpNotificationRepository } from './HttpNotificationRepository';

function notificationDto(
  overrides: Partial<NotificationDto> = {},
): NotificationDto {
  return {
    id: 'notification-1',
    userId: 'user-customer',
    type: 'ORDER',
    title: 'Order #BH-284193 is being prepared',
    body: 'It ships within 24 hours.',
    isRead: false,
    createdAt: '2026-09-02T11:55:00.000Z',
    ...overrides,
  };
}

const page = (content: NotificationDto[]) => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

class FakeHttpClient implements HttpClient {
  readonly requests: RequestConfig[] = [];
  responder: (config: RequestConfig) => unknown = () => undefined;

  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    this.requests.push(config);
    return {
      data: this.responder(config) as T,
      status: 200,
      headers: {},
      correlationId: 'cor-notifications',
    };
  }
}

function fixture() {
  const http = new FakeHttpClient();
  const repository = new HttpNotificationRepository(
    new NotificationRemoteDataSource(http),
  );
  return { http, repository };
}

describe('HttpNotificationRepository.list', () => {
  it('maps the page onto notifications carrying their read state', async () => {
    const { http, repository } = fixture();
    http.responder = () =>
      page([
        notificationDto(),
        notificationDto({ id: 'notification-2', type: 'SOCIAL', isRead: true }),
      ]);

    const result = await repository.list();

    expect(http.requests[0]).toMatchObject({
      method: 'GET',
      endpoint: '/notifications',
      query: { page: 0, size: 20 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value[0]).toMatchObject({ kind: 'ORDER', read: false });
    expect(result.value[1]).toMatchObject({ kind: 'SOCIAL', read: true });
  });

  it('renders a kind it has never met as UNKNOWN instead of dropping the row', async () => {
    const { http, repository } = fixture();
    http.responder = () => page([notificationDto({ type: 'SELLER_PAYOUT' })]);

    const result = await repository.list();

    expect(result.ok && result.value).toHaveLength(1);
    expect(result.ok && result.value[0]?.kind).toBe('UNKNOWN');
  });

  it('unwraps the envelope shape as readily as the bare page (D22)', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({ success: true, data: page([notificationDto()]) });

    expect((await repository.list()).ok).toBe(true);
  });

  it('surfaces a gated read as a failed result (D3)', async () => {
    const { http, repository } = fixture();
    const unauthorized = new UnauthorizedError({
      code: 'UNAUTHORIZED',
      message: 'A valid bearer token is required',
      correlationId: 'cor-notifications',
    });
    http.responder = () => {
      throw unauthorized;
    };

    const result = await repository.list();

    expect(result.ok).toBe(false);
    expect(result.ok || result.error).toBe(unauthorized);
  });
});

describe('HttpNotificationRepository.markAllRead', () => {
  it('posts the invented read-all route and reports the rows it changed', async () => {
    const { http, repository } = fixture();
    http.responder = () => ({ updated: 2 });

    const result = await repository.markAllRead();

    expect(http.requests[0]).toMatchObject({
      method: 'POST',
      endpoint: '/notifications/read-all',
    });
    expect(result.ok && result.value).toBe(2);
  });
});
