import { ok } from '@core/result';

import {
  GetNotificationsUseCase,
  MarkAllReadUseCase,
  unreadCount,
  type AppNotification,
  type NotificationRepository,
} from '@domain/notifications';

function notification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: 'notification-1',
    kind: 'ORDER',
    title: 'Order #BH-284193 is being prepared',
    body: 'It ships within 24 hours.',
    read: false,
    createdAt: '2026-09-02T11:55:00.000Z',
    ...overrides,
  };
}

function repository(): NotificationRepository {
  return {
    list: jest.fn(async () => ok([notification()])),
    markAllRead: jest.fn(async () => ok(2)),
  } as NotificationRepository;
}

describe('notifications domain', () => {
  it('counts only the unread rows — the home bell dot reads this', () => {
    expect(
      unreadCount([
        notification({ id: 'a' }),
        notification({ id: 'b', read: true }),
        notification({ id: 'c' }),
      ]),
    ).toBe(2);
    expect(unreadCount([])).toBe(0);
  });

  it('pages the list at the default size', async () => {
    const notifications = repository();
    await new GetNotificationsUseCase(notifications).execute();

    expect(notifications.list).toHaveBeenCalledWith(0, 20);
  });

  it('reports how many rows mark-all-read changed', async () => {
    const result = await new MarkAllReadUseCase(repository()).execute();

    expect(result).toEqual(ok(2));
  });
});
