import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  AppNotification,
  GetNotificationsUseCase,
  MarkAllReadUseCase,
  NotificationKind,
} from '@domain/notifications';

import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { formatRelativeTime } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

import { useMarkAllRead, useNotifications } from './useNotificationQueries';

/**
 * The prototype's five icon tokens, in its own order: a parcel for an order, a percent for a
 * promotion, a star for a creator post, a downward arrow for a price drop and a tick for a
 * delivery. An unrecognised kind gets a neutral dot rather than no row at all.
 */
const MARK: Record<NotificationKind, string> = {
  ORDER: '📦',
  PROMOTION: '%',
  SOCIAL: '★',
  PRICE_DROP: '↓',
  DELIVERY: '✓',
  UNKNOWN: '•',
};

function tokenColors(
  kind: NotificationKind,
  theme: ReturnType<typeof useTheme>['theme'],
): readonly [string, string] {
  switch (kind) {
    case 'ORDER':
      return [theme.colors.accentLight, theme.colors.accentHover];
    case 'PROMOTION':
      return [theme.colors.pinkLight, theme.colors.pinkAccessible];
    case 'SOCIAL':
      return [theme.colors.warningLight, theme.colors.warningAccessible];
    case 'PRICE_DROP':
      return [theme.colors.successLight, theme.colors.successAccessible];
    case 'DELIVERY':
    case 'UNKNOWN':
      return [theme.colors.background, theme.colors.textSubtleAccessible];
  }
}

export function NotificationRow({
  notification,
}: {
  notification: AppNotification;
}) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.notification;
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const [tone, mark] = tokenColors(notification.kind, theme);
  return (
    <View
      accessibilityLabel={notification.title}
      accessibilityState={{ selected: !notification.read }}
      style={[
        styles.row,
        {
          // The prototype tints an unread row `#FAFAFE` and leaves a read one white.
          backgroundColor: notification.read
            ? theme.colors.surface
            : theme.colors.surfaceField,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.token,
          {
            backgroundColor: tone,
            borderRadius: geometry.tokenRadius,
            height: geometry.tokenSize,
            width: geometry.tokenSize,
          },
        ]}
      >
        <Text color={mark} variant="bodyLg" weight="extrabold">
          {MARK[notification.kind]}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text variant="xs" weight="bold">
          {notification.title}
        </Text>
        <Text color={theme.colors.textSecondary} variant="xxs">
          {notification.body}
        </Text>
        <Text color={theme.colors.textMuted} variant="nano">
          {formatRelativeTime(notification.createdAt, locale)}
        </Text>
      </View>
    </View>
  );
}

export function NotificationsScreen({
  getNotifications,
  markAllRead,
  authenticated,
  onMarkAllFailed,
  onBack,
}: {
  getNotifications: GetNotificationsUseCase;
  markAllRead: MarkAllReadUseCase;
  authenticated: boolean;
  onMarkAllFailed: () => void;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const query = useNotifications({ getNotifications, locale, authenticated });
  const mutation = useMarkAllRead({
    markAllRead,
    locale,
    onFailure: onMarkAllFailed,
  });
  const notifications = query.data ?? [];
  const hasUnread = notifications.some((notification) => !notification.read);

  return (
    <Screen
      accessibilityLabel={t('notifications')}
      background={theme.colors.surface}
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      <ScreenHeader
        title={t('notifications')}
        backLabel={t('back')}
        onBack={onBack}
        actions={
          hasUnread ? (
            <Pressable
              accessibilityLabel={t('markAllRead')}
              compact
              onPress={() => mutation.mutate()}
            >
              <Text
                color={theme.colors.accentHover}
                variant="xxs"
                weight="bold"
              >
                {t('markAllRead')}
              </Text>
            </Pressable>
          ) : null
        }
      />
      {query.isPending ? (
        <View style={styles.states}>
          <Skeleton accessibilityLabel={t('loading')} height={70} />
          <Skeleton accessibilityLabel={t('loading')} height={70} />
          <Skeleton accessibilityLabel={t('loading')} height={70} />
        </View>
      ) : query.isError ? (
        <View style={styles.states}>
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.states}>
          <EmptyState
            title={t('states:notificationsEmptyTitle')}
            body={t('states:notificationsEmptyBody')}
            icon="bell"
          />
        </View>
      ) : (
        notifications.map((notification) => (
          <NotificationRow key={notification.id} notification={notification} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: mobile.notification.copyGap },
  row: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: mobile.notification.rowGap,
    paddingHorizontal: mobile.notification.rowPaddingX,
    paddingVertical: mobile.notification.rowPaddingY,
  },
  states: { gap: mobile.gapItem, padding: mobile.screenPaddingX },
  token: { alignItems: 'center', justifyContent: 'center' },
});
