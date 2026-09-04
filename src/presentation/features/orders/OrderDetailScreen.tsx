import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Money } from '@core/money';

import type { Address, AddressRepository } from '@domain/addresses';
import {
  orderTimeline,
  type GetOrderDetailUseCase,
  type Order,
  type OrderTimelineStep,
} from '@domain/orders';

import { Button } from '@presentation/components/controls';
import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Icon, Image, Text } from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { formatPrice } from '@presentation/formatting';
import { toneAt, useTheme } from '@presentation/theme';

const STEP_KEY: Record<OrderTimelineStep, string> = {
  CREATED: 'stCreated',
  PROCESSING: 'stProcessing',
  SHIPPED: 'stShipped',
  DELIVERED: 'stDelivered',
};

async function orderOf(useCase: GetOrderDetailUseCase, orderId: string) {
  const result = await useCase.execute(orderId);
  if (!result.ok) throw result.error;
  return result.value;
}

async function addressOf(repository: AddressRepository, addressId: string) {
  const result = await repository.getById(addressId);
  // A deleted address must not blank the order it shipped to, so a failed lookup degrades to no
  // address card rather than to the screen's error state.
  return result.ok ? result.value : null;
}

function Timeline({ order }: { order: Order }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const steps = orderTimeline(order.status);
  return (
    <View>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.timelineRow}>
          <View style={styles.timelineMarker}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: step.complete
                    ? theme.colors.successAccessible
                    : theme.colors.borderStrong,
                },
              ]}
            >
              {step.complete ? (
                <Icon name="check" color={theme.colors.textInverse} size={12} />
              ) : null}
            </View>
            {index < steps.length - 1 ? (
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            ) : null}
          </View>
          <Text
            color={
              step.complete
                ? theme.colors.textPrimary
                : theme.colors.textSecondary
            }
            style={styles.timelineLabel}
            variant="xs"
            weight="bold"
          >
            {t(STEP_KEY[step.key])}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * The prototype shows the code only while the courier still needs it. A delivered or cancelled
 * order keeps its `deliveryOtp` in the payload but has no use for it, and showing a spent code
 * invites someone to read it off the screen. The code is never logged and never auto-copied.
 */
function DeliveryOtpPanel({ code }: { code: string }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={t('otpLabel')}
      style={[
        styles.otp,
        { backgroundColor: theme.colors.ink, borderRadius: 14 },
      ]}
    >
      <View style={styles.flex}>
        <Text color={theme.colors.onDarkSecondary} variant="micro">
          {t('otpLabel')}
        </Text>
        <Text
          color={theme.colors.textInverse}
          latin
          variant="h2"
          weight="extrabold"
        >
          {code}
        </Text>
      </View>
      <Text
        align="end"
        color={theme.colors.onDarkMuted}
        style={styles.otpHint}
        variant="micro"
      >
        {t('otpHint')}
      </Text>
    </View>
  );
}

function AddressCard({ address }: { address: Address }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.background, borderRadius: 14 },
      ]}
    >
      <Text color={theme.colors.textMuted} variant="micro" weight="bold">
        {t('shipTo')}
      </Text>
      <Text variant="xs">{`${address.recipientName} · ${address.phone}`}</Text>
      <Text color={theme.colors.textSecondary} variant="xs">
        {`${address.details} — ${address.city}`}
      </Text>
    </View>
  );
}

function Totals({ order }: { order: Order }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const rows: readonly (readonly [string, Money])[] = [
    [t('subtotal'), order.subtotal],
    [t('vat'), order.vat],
    [t('shipping'), order.shipping],
    [t('paymentFee'), order.paymentFee],
    [t('discount'), order.discount],
  ];
  return (
    <View
      style={[
        styles.totals,
        { borderColor: theme.colors.border, borderRadius: 14 },
      ]}
    >
      {rows.map(([label, money]) => (
        <View key={label} style={styles.totalRow}>
          <Text color={theme.colors.textSecondary} variant="xs">
            {label}
          </Text>
          <Text latin variant="xs" weight="bold">
            {formatPrice(money.toDecimal())}
          </Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text color={theme.colors.textSecondary} variant="xs">
          {t('paymentStatus')}
        </Text>
        <Text color={theme.colors.successAccessible} variant="xs" weight="bold">
          {`${t('paid')} · ${t(`payment_${order.paymentMethod}`)}`}
        </Text>
      </View>
      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />
      <View style={styles.totalRow}>
        <Text variant="sm" weight="extrabold">
          {t('paidTotal')}
        </Text>
        <Text latin variant="h3" weight="extrabold">
          {`${formatPrice(order.total.toDecimal())} ${t('omr')}`}
        </Text>
      </View>
    </View>
  );
}

export function OrderDetailScreen({
  orderId,
  getOrder,
  addressRepository,
  onBack,
  onReturn,
  onSupport,
}: {
  orderId: string;
  getOrder: GetOrderDetailUseCase;
  addressRepository: AddressRepository;
  onBack: () => void;
  onReturn: (orderNumber: string) => void;
  onSupport: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const order = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderOf(getOrder, orderId),
  });
  const addressId = order.data?.shippingAddressId;
  const address = useQuery({
    queryKey: ['addresses', addressId],
    queryFn: () => addressOf(addressRepository, addressId as string),
    enabled: Boolean(addressId),
  });

  const title = order.data
    ? `${t('orderNo')} ${order.data.orderNumber}`
    : t('viewOrder');
  const header = (
    <ScreenHeader title={title} backLabel={t('back')} onBack={onBack} />
  );

  if (order.isPending) {
    return (
      <Screen
        accessibilityLabel={t('viewOrder')}
        edgeToEdge
        gap={0}
        paddingTop={0}
      >
        {header}
        <View style={styles.page}>
          <Skeleton accessibilityLabel={t('loading')} height={260} />
        </View>
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen
        accessibilityLabel={t('viewOrder')}
        edgeToEdge
        gap={0}
        paddingTop={0}
      >
        {header}
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void order.refetch()}
        />
      </Screen>
    );
  }

  const value = order.data;
  const showOtp =
    Boolean(value.deliveryOtp) &&
    value.status !== 'DELIVERED' &&
    value.status !== 'CANCELLED';
  return (
    <Screen
      accessibilityLabel={title}
      background={theme.colors.surface}
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      {header}
      <View style={styles.page}>
        <Timeline order={value} />
        {showOtp ? (
          <DeliveryOtpPanel code={value.deliveryOtp as string} />
        ) : null}

        <Text variant="sm" weight="extrabold">
          {t('orderItems')}
        </Text>
        {value.lines.map((line, index) => (
          <View
            key={line.id}
            style={[
              styles.line,
              { borderColor: theme.colors.border, borderRadius: 14 },
            ]}
          >
            <Image
              accessibilityLabel={line.product.title}
              contentFit="contain"
              source={productArtworkSource(
                line.product.images[0]?.url,
                line.product.id,
              )}
              style={[
                styles.lineImage,
                { backgroundColor: toneAt(index), borderRadius: 11 },
              ]}
            />
            <View style={styles.flex}>
              <Text numberOfLines={2} variant="xs">
                {line.product.title}
              </Text>
              <Text color={theme.colors.textMuted} variant="micro">
                {`${t('quantity')} × ${line.quantity.value}`}
              </Text>
            </View>
            <Text latin variant="price" weight="extrabold">
              {formatPrice(line.lineTotal.toDecimal())}
            </Text>
          </View>
        ))}

        {address.data ? <AddressCard address={address.data} /> : null}
        <Totals order={value} />

        <View style={styles.actions}>
          {value.status === 'DELIVERED' ? (
            <Button
              label={t('requestReturn')}
              variant="secondary"
              onPress={() => onReturn(value.orderNumber)}
            />
          ) : null}
          <Button
            label={t('contactSupport')}
            variant="ghost"
            onPress={onSupport}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  divider: { height: 1 },
  dot: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  flex: { flex: 1, gap: 4 },
  line: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  lineImage: { height: 56, width: 56 },
  otp: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 14 },
  otpHint: { maxWidth: 130 },
  page: { gap: 12, padding: 16 },
  panel: { gap: 5, padding: 13 },
  timelineLabel: { flex: 1, paddingBottom: 18 },
  timelineLine: { flex: 1, marginVertical: 3, width: 2 },
  timelineMarker: { alignItems: 'center', width: 24 },
  timelineRow: { flexDirection: 'row', gap: 12, minHeight: 44 },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totals: { borderWidth: 1, gap: 9, padding: 14 },
});
