import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { isAppError } from '@core/errors';
import { Money } from '@core/money';

import {
  isCredit,
  parseAmount,
  TOP_UP_MAXIMUM,
  TOP_UP_MINIMUM,
  transactionSign,
  type GetTransactionsUseCase,
  type GetWalletUseCase,
  type TopUpWalletUseCase,
  type WalletCharge,
  type WalletTransaction,
} from '@domain/wallet';

import { Button, Input } from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { formatDate, formatPrice } from '@presentation/formatting';
import { gradients, mobile, useTheme } from '@presentation/theme';

import { useWallet, useWalletTransactions } from './useWalletQueries';

/** The prototype's four quick amounts, in its order. */
const QUICK_AMOUNTS = [5, 10, 25, 50] as const;

export function TransactionRow({
  transaction,
}: {
  transaction: WalletTransaction;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.wallet;
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const credit = isCredit(transaction.type);
  // AC10.2 — the reference tints a credit green on a green bed and leaves a debit ink on grey.
  const foreground = credit
    ? theme.colors.successAccessible
    : theme.colors.textPrimary;
  const sign = transactionSign(transaction.type) === 1 ? '+' : '−';
  return (
    <View
      accessibilityLabel={transaction.description}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: geometry.rowRadius,
          padding: geometry.rowPadding,
        },
      ]}
    >
      <View
        style={[
          styles.sign,
          {
            backgroundColor: credit
              ? theme.colors.successLight
              : theme.colors.background,
            borderRadius: geometry.signRadius,
            height: geometry.signSize,
            width: geometry.signSize,
          },
        ]}
      >
        <Text color={foreground} latin variant="bodyLg" weight="extrabold">
          {sign}
        </Text>
      </View>
      <View style={styles.rowCopy}>
        <Text variant="xs" weight="bold">
          {transaction.description}
        </Text>
        <Text color={theme.colors.textMuted} variant="micro">
          {formatDate(transaction.createdAt, locale)}
        </Text>
      </View>
      <Text
        accessibilityLabel={`${sign}${formatPrice(transaction.amount.toDecimal())} ${t('omr')}`}
        color={foreground}
        latin
        variant="price"
        weight="extrabold"
      >
        {`${sign}${formatPrice(transaction.amount.toDecimal())}`}
      </Text>
    </View>
  );
}

/**
 * `design-reference/BRANDHUB App.dc.html`: an ink-to-indigo balance card with its bled decorative
 * ring, the wallet-active pill, four quick amounts over a custom field, the Paymob action, and the
 * transaction history.
 */
export function WalletScreen({
  getWallet,
  getTransactions,
  topUpWallet,
  onBack,
  onCharge,
}: {
  getWallet: GetWalletUseCase;
  getTransactions: GetTransactionsUseCase;
  topUpWallet: TopUpWalletUseCase;
  onBack: () => void;
  /**
   * Hands the hosted payment to the composition root. Card details are never typed inside the
   * app (§28 S6), so the screen's job ends at producing a charge.
   */
  onCharge: (charge: WalletCharge) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.wallet;
  const locale = i18n.resolvedLanguage ?? i18n.language;

  const wallet = useWallet(getWallet);
  const history = useWalletTransactions(getTransactions, locale);
  const transactions = history.data?.pages.flat() ?? [];

  const [quick, setQuick] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** A quick amount wins if one is selected; otherwise the custom field is parsed. */
  function chosenAmount(): Money | null {
    if (quick !== null) return Money.fromDecimal(quick);
    const parsed = parseAmount(custom);
    return parsed.ok ? parsed.value : null;
  }

  async function topUp() {
    setError('');
    const value = chosenAmount();
    if (!value) {
      setError(t('topUpInvalidAmount'));
      return;
    }
    setBusy(true);
    const result = await topUpWallet.execute(value);
    setBusy(false);
    if (result.ok) {
      onCharge(result.value);
      return;
    }
    const code = isAppError(result.error) ? result.error.code : '';
    if (code === 'AMOUNT_BELOW_MINIMUM')
      setError(
        t('topUpMinimum', { amount: formatPrice(TOP_UP_MINIMUM.toDecimal()) }),
      );
    else if (code === 'AMOUNT_ABOVE_MAXIMUM')
      setError(
        t('topUpMaximum', { amount: formatPrice(TOP_UP_MAXIMUM.toDecimal()) }),
      );
    else setError(t('topUpFailed'));
  }

  return (
    <Screen
      accessibilityLabel={t('wallet')}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader title={t('wallet')} backLabel={t('back')} onBack={onBack} />

      <LinearGradient
        colors={[...gradients.inkPanel.colors]}
        start={gradients.inkPanel.start}
        end={gradients.inkPanel.end}
        style={[styles.card, { borderRadius: geometry.cardRadius }]}
      >
        <View
          style={[
            styles.cardRing,
            {
              borderColor: theme.colors.onDarkBorder,
              borderRadius: theme.radius.full,
            },
          ]}
        />
        <Text color={theme.colors.onDarkSecondary} variant="xxs">
          {t('balance')}
        </Text>
        {wallet.isPending ? (
          <Skeleton accessibilityLabel={t('loading')} height={36} width="60%" />
        ) : wallet.isError || !wallet.data ? (
          <Text color={theme.colors.textInverse} variant="xs">
            {t('states:genericErrorTitle')}
          </Text>
        ) : (
          <View style={styles.balanceRow}>
            {/* AC10.1 — three decimals, Latin digits, with the OMR label beside them. */}
            <Text
              accessibilityLabel={`${formatPrice(wallet.data.balance.toDecimal())} ${t('omr')}`}
              color={theme.colors.textInverse}
              latin
              style={{ fontSize: geometry.balanceSize }}
              variant="display"
              weight="extrabold"
            >
              {formatPrice(wallet.data.balance.toDecimal())}
            </Text>
            <Text color={theme.colors.onDarkSecondary} variant="sm">
              {t('omr')}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.activePill,
            {
              backgroundColor: theme.colors.mintOnInkSurface,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <View
            style={[
              styles.activeDot,
              {
                backgroundColor: theme.colors.mintOnInk,
                borderRadius: theme.radius.full,
              },
            ]}
          />
          <Text color={theme.colors.mintOnInk} variant="micro" weight="bold">
            {t('walletActive')}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.topUp}>
        <Text variant="sm" weight="extrabold">
          {t('quickAmounts')}
        </Text>
        <View style={styles.amounts}>
          {QUICK_AMOUNTS.map((value) => {
            const selected = quick === value;
            return (
              <Pressable
                key={value}
                accessibilityLabel={formatPrice(value)}
                accessibilityState={{ selected }}
                compact
                compactSize={geometry.amountHeight}
                onPress={() => {
                  // AC10.3 — a quick amount is exclusive with the custom field.
                  setQuick(selected ? null : value);
                  setCustom('');
                  setError('');
                }}
                style={[
                  styles.amount,
                  {
                    backgroundColor: selected
                      ? theme.colors.accentLight
                      : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.accent
                      : theme.colors.border,
                    borderRadius: geometry.amountRadius,
                    height: geometry.amountHeight,
                  },
                ]}
              >
                <Text
                  color={selected ? theme.colors.accentHover : undefined}
                  latin
                  variant="sm"
                  weight="extrabold"
                >
                  {formatPrice(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Input
          label={t('customAmount')}
          inputDirection="ltr"
          keyboardType="decimal-pad"
          placeholder="0.000"
          value={custom}
          onChangeText={(value) => {
            setCustom(value);
            setQuick(null);
            setError('');
          }}
          {...(error ? { error } : {})}
        />
        <Text color={theme.colors.textMuted} variant="micro">
          {t('hostedPaymentNote')}
        </Text>
        <Button
          fullWidth
          label={t('payWithPaymob')}
          loading={busy}
          onPress={() => void topUp()}
        />
      </View>

      <View style={styles.history}>
        <Text variant="sm" weight="extrabold">
          {t('txHistory')}
        </Text>
        {history.isPending ? (
          <>
            <Skeleton accessibilityLabel={t('loading')} height={58} />
            <Skeleton accessibilityLabel={t('loading')} height={58} />
            <Skeleton accessibilityLabel={t('loading')} height={58} />
          </>
        ) : history.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void history.refetch()}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            title={t('states:walletEmptyTitle')}
            body={t('states:walletEmptyBody')}
            icon="cart"
          />
        ) : (
          <>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
            {history.hasNextPage ? (
              <Button
                fullWidth
                label={t('viewAll')}
                loading={history.isFetchingNextPage}
                variant="secondary"
                onPress={() => void history.fetchNextPage()}
              />
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    height: mobile.wallet.pillDotSize,
    width: mobile.wallet.pillDotSize,
  },
  activePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: mobile.wallet.pillPaddingX,
    paddingVertical: mobile.wallet.pillPaddingY,
  },
  amount: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexGrow: 1,
    flexBasis: '22%',
    justifyContent: 'center',
  },
  amounts: {
    flexDirection: 'row',
    gap: mobile.wallet.amountGap,
  },
  balanceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  card: {
    gap: mobile.wallet.cardGap,
    margin: mobile.wallet.cardMargin,
    overflow: 'hidden',
    padding: mobile.wallet.cardPadding,
  },
  cardRing: {
    borderWidth: 2,
    height: mobile.wallet.ringSize,
    insetInlineEnd: mobile.wallet.ringInsetEnd,
    position: 'absolute',
    top: mobile.wallet.ringTop,
    width: mobile.wallet.ringSize,
  },
  history: {
    gap: mobile.wallet.sectionGap,
    paddingBottom: 24,
    paddingHorizontal: mobile.screenPaddingX,
    paddingTop: 20,
  },
  row: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: mobile.wallet.rowGap,
  },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  sign: { alignItems: 'center', justifyContent: 'center' },
  topUp: {
    gap: mobile.wallet.sectionGap,
    paddingHorizontal: mobile.screenPaddingX,
  },
});
