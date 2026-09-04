import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AppError } from '@core/errors';

import type { CartLine } from '@domain/cart';
import type {
  CalculateCartTotalsUseCase,
  ShippingAreaRepository,
} from '@domain/checkout';

import { Button, Input } from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import {
  Icon,
  Image,
  Pressable,
  Text,
} from '@presentation/components/primitives';
import { productArtworkSource } from '@presentation/features/catalog/components';
import { formatPrice } from '@presentation/formatting';
import { toneAt, useTheme } from '@presentation/theme';

import { useCartContext } from './CartProvider';

async function areasOf(repository: ShippingAreaRepository) {
  const result = await repository.list();
  if (!result.ok) throw result.error;
  return result.value;
}

function errorMessage(error: AppError | null, fallback: string): string {
  if (!error) return '';
  return error.code === 'INSUFFICIENT_STOCK' ? error.message : fallback;
}

export function CartScreen({
  shippingAreaRepository,
  calculateTotals,
  onCheckout,
  onDiscover,
}: {
  shippingAreaRepository: ShippingAreaRepository;
  calculateTotals: CalculateCartTotalsUseCase;
  onCheckout: () => void;
  onDiscover: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const cart = useCartContext();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [lineError, setLineError] = useState('');
  const areas = useQuery({
    queryKey: ['shipping-areas'],
    queryFn: () => areasOf(shippingAreaRepository),
  });
  // The app shell's seeded delivery location is Al Khoud, which resolves to Seeb (D21).
  const area =
    areas.data?.find((item) => item.id === 'area-seeb') ??
    areas.data?.[0] ??
    null;
  const totals = cart.cart
    ? calculateTotals.execute(cart.cart, area, 'CREDIT_CARD', cart.coupon)
    : null;

  async function update(line: CartLine, quantity: number) {
    setLineError('');
    const failure = await cart.update(line, quantity);
    setLineError(errorMessage(failure, t('cartUpdateFailed')));
  }

  async function apply() {
    setCouponError('');
    const failure = await cart.applyCoupon(couponCode);
    if (failure) setCouponError(t('invalidCoupon'));
  }

  const lines = cart.cart?.lines ?? [];
  return (
    <Screen
      accessibilityLabel={t('cart')}
      background={theme.colors.background}
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
        <Text variant="h3" weight="extrabold">
          {t('cart')}
        </Text>
        <Text color={theme.colors.textMuted} latin variant="xs">
          {cart.count} {t('items')}
        </Text>
      </View>

      {cart.isPending ? (
        <View style={styles.loading}>
          <Skeleton accessibilityLabel={t('loading')} height={102} />
          <Skeleton accessibilityLabel={t('loading')} height={102} />
        </View>
      ) : cart.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={cart.refetch}
        />
      ) : lines.length === 0 ? (
        <EmptyState
          title={t('cartEmpty')}
          body={t('cartEmptyBody')}
          actionLabel={t('discover')}
          icon="cart"
          onAction={onDiscover}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {totals && totals.freeShippingRemaining.baisa > 0 ? (
              <View
                style={[
                  styles.shippingHint,
                  {
                    backgroundColor: theme.colors.accentLight,
                    borderRadius: theme.radius.control,
                  },
                ]}
              >
                <Icon name="truck" color={theme.colors.accentHover} size={18} />
                <Text
                  color={theme.colors.accentHover}
                  variant="xs"
                  weight="bold"
                >
                  {t('freeShippingRemaining', {
                    amount: formatPrice(
                      totals.freeShippingRemaining.toDecimal(),
                    ),
                  })}
                </Text>
              </View>
            ) : totals ? (
              <View
                style={[
                  styles.shippingHint,
                  {
                    backgroundColor: theme.colors.successLight,
                    borderRadius: theme.radius.control,
                  },
                ]}
              >
                <Icon
                  name="check"
                  color={theme.colors.successAccessible}
                  size={18}
                />
                <Text
                  color={theme.colors.successAccessible}
                  variant="xs"
                  weight="bold"
                >
                  {t('freeShippingUnlocked')}
                </Text>
              </View>
            ) : null}

            {lineError ? (
              <Text color={theme.colors.dangerAccessible} variant="xs">
                {lineError}
              </Text>
            ) : null}

            <View style={styles.lines}>
              {lines.map((line, index) => (
                <View
                  key={line.id}
                  style={[
                    styles.line,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: 16,
                    },
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
                      styles.image,
                      { backgroundColor: toneAt(index), borderRadius: 12 },
                    ]}
                  />
                  <View style={styles.lineCopy}>
                    <Text numberOfLines={2} variant="xs" weight="bold">
                      {line.product.title}
                    </Text>
                    <Text color={theme.colors.textMuted} variant="micro">
                      {Object.values(line.variant.attributes).join(' · ')}
                    </Text>
                    <View style={styles.lineBottom}>
                      <Text latin variant="price" weight="extrabold">
                        {formatPrice(line.lineTotal.toDecimal())} {t('omr')}
                      </Text>
                      <View
                        accessibilityLabel={t('quantity')}
                        style={[
                          styles.stepper,
                          {
                            backgroundColor: theme.colors.background,
                            borderRadius: theme.radius.full,
                          },
                        ]}
                      >
                        <Pressable
                          accessibilityLabel={t('decrease')}
                          compact
                          compactSize={28}
                          onPress={() =>
                            void update(line, line.quantity.value - 1)
                          }
                          style={styles.stepAction}
                        >
                          <Icon name="minus" size={14} />
                        </Pressable>
                        <Text latin variant="xs" weight="bold">
                          {line.quantity.value}
                        </Text>
                        <Pressable
                          accessibilityLabel={t('increase')}
                          compact
                          compactSize={28}
                          disabled={line.quantity.value >= line.variant.stock}
                          onPress={() =>
                            void update(line, line.quantity.value + 1)
                          }
                          style={styles.stepAction}
                        >
                          <Icon name="plus" size={14} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    accessibilityLabel={t('remove')}
                    compact
                    compactSize={30}
                    onPress={() => void cart.remove(line)}
                    style={styles.remove}
                  >
                    <Icon
                      name="close"
                      color={theme.colors.textMuted}
                      size={15}
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            <View
              style={[
                styles.promo,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: 16,
                },
              ]}
            >
              <Input
                label={t('promoCode')}
                placeholder={t('promoCode')}
                value={couponCode}
                error={couponError}
                inputDirection="ltr"
                onChangeText={setCouponCode}
                trailing={
                  <Pressable
                    accessibilityLabel={t('apply')}
                    compact
                    onPress={() => void apply()}
                  >
                    <Text
                      color={theme.colors.accentHover}
                      variant="xs"
                      weight="bold"
                    >
                      {t('apply')}
                    </Text>
                  </Pressable>
                }
              />
              {cart.coupon ? (
                <Text color={theme.colors.successAccessible} variant="xs">
                  {t('couponApplied', { code: cart.coupon.code })}
                </Text>
              ) : null}
            </View>

            {totals ? <TotalsCard totals={totals} /> : null}
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
            <Button fullWidth label={t('checkout')} onPress={onCheckout} />
          </View>
        </>
      )}
    </Screen>
  );
}

export function TotalsCard({
  totals,
}: {
  totals: import('@domain/checkout').CartTotals;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const rows = [
    [t('subtotal'), totals.subtotal],
    [t('vat'), totals.vat],
    [t('shipping'), totals.shipping],
    ...(totals.paymentFee.baisa > 0
      ? [[t('paymentFee'), totals.paymentFee] as const]
      : []),
    ...(totals.discount.baisa > 0
      ? [[t('discount'), totals.discount] as const]
      : []),
  ] as const;
  return (
    <View
      style={[
        styles.totals,
        { backgroundColor: theme.colors.surface, borderRadius: 16 },
      ]}
    >
      {rows.map(([label, value]) => (
        <View key={label} style={styles.totalRow}>
          <Text color={theme.colors.textSecondary} variant="xs">
            {label}
          </Text>
          <Text latin variant="xs" weight="semibold">
            {value.baisa === 0 && label === t('shipping')
              ? t('free')
              : `${formatPrice(value.toDecimal())} ${t('omr')}`}
          </Text>
        </View>
      ))}
      <View style={[styles.rule, { backgroundColor: theme.colors.border }]} />
      <View style={styles.totalRow}>
        <Text variant="body" weight="extrabold">
          {t('total')}
        </Text>
        <Text latin variant="bodyLg" weight="extrabold">
          {formatPrice(totals.total.toDecimal())} {t('omr')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 14, paddingBottom: 20 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  image: { height: 78, width: 78 },
  line: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 11,
    position: 'relative',
  },
  lineBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  lineCopy: { flex: 1, gap: 3, minHeight: 78 },
  lines: { gap: 10 },
  loading: { gap: 12, padding: 16 },
  promo: { borderStyle: 'dashed', borderWidth: 1, gap: 8, padding: 13 },
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    end: 5,
    top: 5,
  },
  rule: { height: 1, marginVertical: 4 },
  shippingHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  stepAction: { alignItems: 'center', justifyContent: 'center' },
  stepper: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totals: { gap: 10, padding: 14 },
});
