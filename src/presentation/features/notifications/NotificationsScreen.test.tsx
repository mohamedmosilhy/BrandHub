import { ServerError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  GetNotificationsUseCase,
  MarkAllReadUseCase,
  type AppNotification,
  type NotificationRepository,
} from '@domain/notifications';

import { fireEvent, renderWithProviders, screen, waitFor } from '@test/render';

import { NotificationsScreen } from './NotificationsScreen';
/** The unread tint is announced as `selected`, so the state is read off the row's props. */
const unread = (title: string) =>
  screen.getByLabelText(title).props['accessibilityState'].selected;

function buildNotification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: 'notification-1',
    kind: 'ORDER',
    title: 'طلبك #BH-284193 قيد التجهيز',
    body: 'سيخرج للتوصيل خلال 24 ساعة.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1_000).toISOString(),
    ...overrides,
  };
}

/**
 * Stateful, like the server: mark-all-read has to survive the refetch that follows it, or an
 * optimistic-only implementation would pass AC11.8 while changing nothing.
 */
function repository(
  overrides: Partial<NotificationRepository> = {},
): jest.Mocked<NotificationRepository> {
  let rows = [
    buildNotification(),
    buildNotification({
      id: 'notification-2',
      kind: 'PROMOTION',
      title: 'خصم 25% على الصوتيات',
      body: 'العرض ينتهي منتصف الليل.',
    }),
    buildNotification({
      id: 'notification-3',
      kind: 'SOCIAL',
      title: 'ليان المعمري نشرت منشوراً جديداً',
      body: 'إطلالة جديدة.',
      read: true,
    }),
  ];
  return {
    list: jest.fn(async () => ok(rows)),
    markAllRead: jest.fn(async () => {
      const changed = rows.filter((row) => !row.read).length;
      rows = rows.map((row) => ({ ...row, read: true }));
      return ok(changed);
    }),
    ...overrides,
  } as unknown as jest.Mocked<NotificationRepository>;
}

async function mount({
  port = repository(),
  authenticated = true,
}: {
  port?: jest.Mocked<NotificationRepository>;
  authenticated?: boolean;
} = {}) {
  const onMarkAllFailed = jest.fn();
  await renderWithProviders(
    <NotificationsScreen
      getNotifications={new GetNotificationsUseCase(port)}
      markAllRead={new MarkAllReadUseCase(port)}
      authenticated={authenticated}
      onMarkAllFailed={onMarkAllFailed}
      onBack={jest.fn()}
    />,
  );
  return { port, onMarkAllFailed };
}

describe('NotificationsScreen', () => {
  it('AC11.7 — shows title, body and relative time, and marks unread rows', async () => {
    await mount();

    await waitFor(() =>
      expect(screen.getByText('طلبك #BH-284193 قيد التجهيز')).toBeOnTheScreen(),
    );
    expect(screen.getByText('سيخرج للتوصيل خلال 24 ساعة.')).toBeOnTheScreen();
    expect(screen.getAllByText('قبل 2 ساعة')).toHaveLength(3);
    // The unread rows announce themselves as selected; the read one does not.
    expect(unread('طلبك #BH-284193 قيد التجهيز')).toBe(true);
    expect(unread('ليان المعمري نشرت منشوراً جديداً')).toBe(false);
  });

  it('AC11.8 — mark-all-read clears every unread state and then hides itself', async () => {
    const { port } = await mount();

    await waitFor(() =>
      expect(screen.getByLabelText('تعليم الكل كمقروء')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('تعليم الكل كمقروء'));

    await waitFor(() => expect(port.markAllRead).toHaveBeenCalled());
    await waitFor(() =>
      expect(unread('طلبك #BH-284193 قيد التجهيز')).toBe(false),
    );
    // Nothing is unread, so the prototype's action has nothing left to do.
    expect(screen.queryByLabelText('تعليم الكل كمقروء')).not.toBeOnTheScreen();
  });

  it('restores the unread state and reports a failed mark-all-read', async () => {
    const { onMarkAllFailed } = await mount({
      port: repository({
        markAllRead: jest.fn(async () =>
          err(
            new ServerError(500, {
              code: 'SERVER',
              message: 'boom',
              correlationId: 'cor-notifications',
            }),
          ),
        ),
      }),
    });

    await waitFor(() =>
      expect(screen.getByLabelText('تعليم الكل كمقروء')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByLabelText('تعليم الكل كمقروء'));

    await waitFor(() => expect(onMarkAllFailed).toHaveBeenCalled());
    expect(unread('طلبك #BH-284193 قيد التجهيز')).toBe(true);
  });

  it('AC11.9 — an account with no notifications shows the empty state', async () => {
    await mount({
      port: repository({ list: jest.fn(async () => ok([])) }),
    });

    await waitFor(() =>
      expect(screen.getByText('لا توجد إشعارات جديدة')).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('تعليم الكل كمقروء')).not.toBeOnTheScreen();
  });

  it('offers a retry when the list cannot be read', async () => {
    const { port } = await mount({
      port: repository({
        list: jest.fn(async () =>
          err(
            new ServerError(503, {
              code: 'SERVER',
              message: 'down',
              correlationId: 'cor-notifications',
            }),
          ),
        ),
      }),
    });

    await waitFor(() =>
      expect(screen.getByText('تعذّر تحميل المحتوى')).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByText('إعادة المحاولة'));
    await waitFor(() => expect(port.list).toHaveBeenCalledTimes(2));
  });
});
