import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  DEFAULT_PAGE_SIZE,
  type GetOrdersUseCase,
  type Order,
  type OrderStatus,
} from '@domain/orders';

import { Button } from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { StatusPill, type BadgeTone } from '@presentation/components/surfaces';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { formatDate, formatPrice } from '@presentation/formatting';
import { toneAt, useTheme } from '@presentation/theme';

/**
 * The prototype's four timeline labels double as the list's status pills, so a status maps onto
 * the same copy in both places. `CANCELLED` is the one status the timeline cannot express.
 */
const STATUS_KEY: Record<OrderStatus, string> = {
  PENDING: 'stCreated',
  CONFIRMED: 'stProcessing',
  PROCESSING: 'stProcessing',
  SHIPPED: 'stShipped',
  DELIVERED: 'stDelivered',
  CANCELLED: 'cancelled',
  UNKNOWN: 'stCreated',
};

function statusTone(status: OrderStatus): BadgeTone {
  if (status === 'DELIVERED') return 'success';
  return status === 'CANCELLED' ? 'danger' : 'accent';
}

export function OrderCard({
  order,
  index,
  onPress,
}: {
  order: Order;
  index: number;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const first = order.lines[0];
  return (
    <Pressable
      accessibilityLabel={`${t('orderNo')} ${order.orderNumber}`}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 16,
        },
      ]}
    >
      {first ? (
        <Image
          accessibilityLabel={first.product.title}
          contentFit="contain"
          source={productArtworkSource(
            first.product.images[0]?.url,
            first.product.id,
          )}
          style={[
            styles.thumb,
            { backgroundColor: toneAt(index), borderRadius: 12 },
          ]}
        />
      ) : null}
      <View style={styles.copy}>
        <View style={styles.row}>
          <Text latin variant="xs" weight="bold">
            {order.orderNumber}
          </Text>
          <StatusPill
            label={t(STATUS_KEY[order.status])}
            tone={statusTone(order.status)}
          />
        </View>
        <Text color={theme.colors.textMuted} variant="micro">
          {`${formatDate(order.createdAt, locale)} · ${order.lines.length} ${t('items')}`}
        </Text>
        <Text latin variant="price" weight="extrabold">
          {`${formatPrice(order.total.toDecimal())} ${t('omr')}`}
        </Text>
      </View>
      <Icon
        name="chevron-forward"
        color={theme.colors.borderStrong}
        size={18}
      />
    </Pressable>
  );
}

export function OrdersScreen({
  getOrders,
  onBack,
  onOrder,
}: {
  getOrders: GetOrdersUseCase;
  onBack: () => void;
  onOrder: (orderId: string) => void;
}) {
  const { t } = useTranslation();
  const query = useInfiniteQuery({
    queryKey: ['orders', 'list'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const result = await getOrders.execute(pageParam);
      if (!result.ok) throw result.error;
      return result.value;
    },
    // A short page is the last page: the API reports a total, but paging on length needs no
    // second source of truth and behaves the same when an order is added mid-scroll.
    getNextPageParam: (last, pages) =>
      last.length < DEFAULT_PAGE_SIZE ? undefined : pages.length,
  });
  const orders = query.data?.pages.flat() ?? [];

  return (
    <Screen accessibilityLabel={t('orders')} edgeToEdge gap={0} paddingTop={0}>
      <ScreenHeader title={t('orders')} backLabel={t('back')} onBack={onBack} />
      <View style={styles.list}>
        {query.isPending ? (
          <>
            <Skeleton accessibilityLabel={t('loading')} height={86} />
            <Skeleton accessibilityLabel={t('loading')} height={86} />
            <Skeleton accessibilityLabel={t('loading')} height={86} />
          </>
        ) : query.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title={t('states:ordersEmptyTitle')}
            body={t('states:ordersEmptyBody')}
            icon="cart"
          />
        ) : (
          <>
            {orders.map((order, index) => (
              <OrderCard
                key={order.id}
                index={index}
                order={order}
                onPress={() => onOrder(order.id)}
              />
            ))}
            {query.hasNextPage ? (
              <Button
                fullWidth
                label={t('viewAll')}
                loading={query.isFetchingNextPage}
                variant="secondary"
                onPress={() => void query.fetchNextPage()}
              />
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  copy: { flex: 1, gap: 5 },
  list: { gap: 11, padding: 16 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  thumb: { height: 62, width: 62 },
});
