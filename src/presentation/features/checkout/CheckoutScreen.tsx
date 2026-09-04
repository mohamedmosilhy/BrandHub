import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type {
  CalculateCartTotalsUseCase,
  CheckoutAddressRepository,
  PaymentMethod,
  ShippingAreaRepository,
} from '@domain/checkout';
import type { PlaceOrderUseCase } from '@domain/orders';

import { Button, Input } from '@presentation/components/controls';
import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { TotalsCard, useCartContext } from '@presentation/features/cart';
import { useTheme } from '@presentation/theme';

async function listOf<T>(
  operation: Promise<
    import('@core/result').Result<readonly T[], import('@core/errors').AppError>
  >,
) {
  const result = await operation;
  if (!result.ok) throw result.error;
  return result.value;
}

const METHODS: readonly PaymentMethod[] = [
  'THAWANI',
  'CREDIT_CARD',
  'APPLE_PAY',
  'CASH_ON_DELIVERY',
];

export function CheckoutScreen({
  addressRepository,
  shippingAreaRepository,
  calculateTotals,
  placeOrder,
  onBack,
  onPlaced,
}: {
  addressRepository: CheckoutAddressRepository;
  shippingAreaRepository: ShippingAreaRepository;
  calculateTotals: CalculateCartTotalsUseCase;
  placeOrder: PlaceOrderUseCase;
  onBack: () => void;
  onPlaced: (orderId: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const cart = useCartContext();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('CREDIT_CARD');
  const [showAddresses, setShowAddresses] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newAreaId, setNewAreaId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const addresses = useQuery({
    queryKey: ['checkout-addresses'],
    queryFn: () => listOf(addressRepository.list()),
  });
  const areas = useQuery({
    queryKey: ['shipping-areas'],
    queryFn: () => listOf(shippingAreaRepository.list()),
  });
  const preferred =
    addresses.data?.find((item) => item.isDefault) ?? addresses.data?.[0];
  const effectiveAddressId = addressId ?? preferred?.id ?? null;
  const address =
    addresses.data?.find((item) => item.id === effectiveAddressId) ?? null;
  const area = areas.data?.find((item) => item.id === address?.areaId) ?? null;
  const totals = useMemo(
    () =>
      cart.cart
        ? calculateTotals.execute(cart.cart, area, payment, cart.coupon)
        : null,
    [area, calculateTotals, cart.cart, cart.coupon, payment],
  );

  async function saveAddress() {
    const selectedArea =
      areas.data?.find((item) => item.id === newAreaId) ?? areas.data?.[0];
    if (
      !newName.trim() ||
      !newPhone.trim() ||
      !newLine.trim() ||
      !selectedArea
    ) {
      setAddressError(t('requiredField'));
      return;
    }
    setAddressError('');
    const result = await addressRepository.save({
      fullName: newName.trim(),
      phone: newPhone.trim(),
      addressLine1: newLine.trim(),
      city: selectedArea.name,
      areaId: selectedArea.id,
    });
    if (!result.ok) {
      setAddressError(t('checkoutFailed'));
      return;
    }
    setAddressId(result.value.id);
    await addresses.refetch();
  }

  async function submit() {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError('');
    const result = await placeOrder.execute({
      shippingAddressId: effectiveAddressId,
      paymentMethod: payment,
      coupon: cart.coupon,
    });
    if (!result.ok) {
      const affectedProduct = result.error.details?.['productName'];
      setSubmitError(
        result.error.code === 'PAYMENT_DECLINED'
          ? t('paymentDeclined')
          : result.error.code === 'INSUFFICIENT_STOCK' ||
              result.error.code === 'CONFLICT'
            ? t('checkoutStockChanged', {
                product:
                  typeof affectedProduct === 'string'
                    ? affectedProduct
                    : t('anItem'),
              })
            : result.error.code.startsWith('NETWORK_')
              ? t('checkoutNetworkError')
              : t('checkoutFailed'),
      );
      submitLock.current = false;
      setSubmitting(false);
      return;
    }
    cart.markOrdered();
    onPlaced(result.value.id);
  }

  if (addresses.isPending || areas.isPending) {
    return (
      <Screen accessibilityLabel={t('checkoutTitle')}>
        <Skeleton accessibilityLabel={t('loading')} height={150} />
        <Skeleton accessibilityLabel={t('loading')} height={240} />
      </Screen>
    );
  }
  if (addresses.isError || areas.isError) {
    return (
      <Screen accessibilityLabel={t('checkoutTitle')}>
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => {
            void addresses.refetch();
            void areas.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      accessibilityLabel={t('checkoutTitle')}
      background={theme.colors.background}
      bottomInset
      edgeToEdge
      gap={0}
      scroll={false}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityLabel={t('back')}
          compact
          onPress={onBack}
          style={styles.iconAction}
        >
          <Icon name="arrow-back" />
        </Pressable>
        <Text variant="bodyLg" weight="extrabold">
          {t('checkoutTitle')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.steps}>
          {[t('stepAddress'), t('stepPayment'), t('stepReview')].map(
            (label, index) => (
              <View key={label} style={styles.step}>
                <View
                  style={[
                    styles.stepDot,
                    { backgroundColor: theme.colors.accentHover },
                  ]}
                >
                  <Text
                    color={theme.colors.textInverse}
                    latin
                    variant="micro"
                    weight="bold"
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text
                  color={theme.colors.accentHover}
                  variant="micro"
                  weight="bold"
                >
                  {label}
                </Text>
              </View>
            ),
          )}
        </View>

        <Text variant="sm" weight="extrabold">
          {t('deliveryAddress')}
        </Text>
        {address ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.cardTitle}>
              <Icon name="map-pin" color={theme.colors.accentHover} size={19} />
              <View style={styles.flex}>
                <Text variant="xs" weight="bold">
                  {address.fullName}
                </Text>
                <Text color={theme.colors.textSecondary} variant="xs">
                  {address.addressLine1}, {address.city}
                </Text>
                {area ? (
                  <Text color={theme.colors.textMuted} variant="micro">
                    {t('deliveryEstimate', {
                      days: area.estimatedDeliveryDays,
                    })}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel={t('change')}
                compact
                onPress={() => setShowAddresses((value) => !value)}
              >
                <Text
                  color={theme.colors.accentHover}
                  variant="xs"
                  weight="bold"
                >
                  {t('change')}
                </Text>
              </Pressable>
            </View>
            {showAddresses
              ? addresses.data?.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={item.addressLine1}
                    onPress={() => {
                      setAddressId(item.id);
                      setShowAddresses(false);
                    }}
                    style={[
                      styles.addressChoice,
                      { borderTopColor: theme.colors.border },
                    ]}
                  >
                    <Icon
                      name={
                        item.id === effectiveAddressId ? 'check' : 'map-pin'
                      }
                      color={
                        item.id === effectiveAddressId
                          ? theme.colors.successAccessible
                          : theme.colors.textMuted
                      }
                      size={16}
                    />
                    <Text variant="xs">
                      {item.addressLine1}, {item.city}
                    </Text>
                  </Pressable>
                ))
              : null}
          </View>
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="xs" weight="bold">
              {t('addAddress')}
            </Text>
            <Input
              label={t('fullName')}
              value={newName}
              onChangeText={setNewName}
            />
            <Input
              label={t('phone')}
              inputDirection="ltr"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <Input
              label={t('addressLine')}
              value={newLine}
              onChangeText={setNewLine}
            />
            <Text variant="xxs" weight="bold">
              {t('city')}
            </Text>
            <View style={styles.areaChoices}>
              {areas.data?.map((item, index) => {
                const selected = (newAreaId ?? areas.data?.[0]?.id) === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected }}
                    onPress={() => setNewAreaId(item.id)}
                    style={[
                      styles.areaChoice,
                      {
                        backgroundColor: selected
                          ? theme.colors.accentLight
                          : theme.colors.background,
                        borderColor: selected
                          ? theme.colors.accentHover
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      color={
                        selected
                          ? theme.colors.accentHover
                          : theme.colors.textSecondary
                      }
                      variant="micro"
                      weight="bold"
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {addressError ? (
              <Text color={theme.colors.dangerAccessible} variant="xs">
                {addressError}
              </Text>
            ) : null}
            <Button
              fullWidth
              label={t('saveAddr')}
              size="md"
              onPress={() => void saveAddress()}
            />
          </View>
        )}

        <Text variant="sm" weight="extrabold">
          {t('stepPayment')}
        </Text>
        <View style={styles.paymentGrid}>
          {METHODS.map((method) => {
            const selected = payment === method;
            return (
              <Pressable
                key={method}
                accessibilityLabel={t(`payment_${method}`)}
                accessibilityState={{ selected }}
                onPress={() => setPayment(method)}
                style={[
                  styles.payment,
                  {
                    backgroundColor: selected
                      ? theme.colors.accentLight
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.accentHover
                      : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected
                        ? theme.colors.accentHover
                        : theme.colors.borderStrong,
                    },
                  ]}
                >
                  {selected ? (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: theme.colors.accentHover },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <Text variant="xs" weight="bold">
                    {t(`payment_${method}`)}
                  </Text>
                  <Text color={theme.colors.textMuted} variant="micro">
                    {t(`paymentMeta_${method}`)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text variant="sm" weight="extrabold">
          {t('orderSummary')}
        </Text>
        {totals ? <TotalsCard totals={totals} /> : null}
        {submitError ? (
          <View
            style={[
              styles.failure,
              { backgroundColor: theme.colors.dangerLight },
            ]}
          >
            <Icon
              name="warning"
              color={theme.colors.dangerAccessible}
              size={18}
            />
            <Text color={theme.colors.dangerAccessible} variant="xs">
              {submitError}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          disabled={!address || !cart.cart?.lines.length}
          fullWidth
          label={t('placeOrder')}
          loading={submitting}
          onPress={() => void submit()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addressChoice: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingTop: 10,
  },
  areaChoice: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  areaChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  card: { borderRadius: 16, borderWidth: 1, gap: 10, padding: 13 },
  cardTitle: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  content: { gap: 12, padding: 16, paddingBottom: 24 },
  failure: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    padding: 12,
  },
  flex: { flex: 1, gap: 3 },
  footer: { borderTopWidth: 1, padding: 12 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerSpacer: { width: 44 },
  iconAction: { alignItems: 'center', justifyContent: 'center' },
  payment: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    flexBasis: '47%',
    flexDirection: 'row',
    gap: 9,
    minHeight: 68,
    padding: 11,
  },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  radio: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 17,
    justifyContent: 'center',
    width: 17,
  },
  radioDot: { borderRadius: 4, height: 8, width: 8 },
  step: { alignItems: 'center', flex: 1, gap: 5 },
  stepDot: {
    alignItems: 'center',
    borderRadius: 14,
    height: 27,
    justifyContent: 'center',
    width: 27,
  },
  steps: { flexDirection: 'row', paddingBottom: 5 },
});
