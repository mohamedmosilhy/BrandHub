import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type {
  AppNotification,
  GetNotificationsUseCase,
  MarkAllReadUseCase,
} from '@domain/notifications';

/**
 * Notification copy is resolved from `Accept-Language` like the catalogue's, so the key is
 * locale-scoped. There is no push channel to invalidate it (D17) — the list changes when it is
 * read, and when the customer pulls to refresh.
 */
export const notificationKeys = {
  all: (locale: string) => ['notifications', locale] as const,
};

async function valueOf<T>(operation: Promise<Result<T, AppError>>) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

export function useNotifications({
  getNotifications,
  locale,
  authenticated,
}: {
  getNotifications: GetNotificationsUseCase;
  locale: string;
  authenticated: boolean;
}) {
  return useQuery({
    queryKey: notificationKeys.all(locale),
    queryFn: () => valueOf(getNotifications.execute()),
    // D3 — notifications are identity-bound. A guest has none to read, and asking would 401.
    enabled: authenticated,
  });
}

/**
 * Mark-all-read is optimistic: every row loses its unread tint at once, and so does the home
 * bell's dot, because both read the same cache. A failure restores the snapshot and says so.
 */
export function useMarkAllRead({
  markAllRead,
  locale,
  onFailure,
}: {
  markAllRead: MarkAllReadUseCase;
  locale: string;
  onFailure: () => void;
}) {
  const client = useQueryClient();
  const key = notificationKeys.all(locale);
  return useMutation({
    mutationFn: () => valueOf(markAllRead.execute()),
    onMutate: async () => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<readonly AppNotification[]>(key);
      client.setQueryData<readonly AppNotification[]>(key, (current) =>
        current?.map((notification) => ({ ...notification, read: true })),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) client.setQueryData(key, context.previous);
      onFailure();
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * The unread count behind the home bell's dot. Home is public, so this stays disabled for a
 * guest and the dot simply never appears.
 */
export function useUnreadNotifications({
  getNotifications,
  locale,
  authenticated,
}: {
  getNotifications: GetNotificationsUseCase;
  locale: string;
  authenticated: boolean;
}): number {
  const query = useNotifications({ getNotifications, locale, authenticated });
  return (query.data ?? []).filter((notification) => !notification.read).length;
}
