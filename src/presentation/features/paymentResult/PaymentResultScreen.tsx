import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { CheckPaymentStatusUseCase, PaymentStatus } from '@domain/wallet';

import { Button } from '@presentation/components/controls';
import { Screen } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { useRefreshWallet } from '@presentation/features/wallet';
import { formatPrice } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

export type PaymentOutcome = 'success' | 'failed' | 'pending';

/** How often a pending charge is re-asked about, and for how long before it is left pending. */
const POLL_INTERVAL_MS = 2_000;
const POLL_LIMIT = 15;

function outcomeOf(status: PaymentStatus): PaymentOutcome {
  if (status === 'PAID') return 'success';
  if (status === 'FAILED') return 'failed';
  return 'pending';
}

/**
 * `design-reference/BRANDHUB App.dc.html`: a full-bleed banner carrying a 66 px mark, the title,
 * the explanatory line and the charged amount, over back-to-wallet and — on failure only — retry.
 *
 * The prototype's "preview state" switcher at the foot of its screen is a mock-up affordance for
 * showing all three variants; it is not built.
 */
export function PaymentResultScreen({
  status,
  amount,
  gatewayOrderId,
  checkPaymentStatus,
  onBackToWallet,
  onRetry,
}: {
  status: PaymentOutcome;
  /** The charged amount, as the decimal string the return URL carried. */
  amount: string;
  /** Absent when the app came back without one; the screen then cannot poll and says pending. */
  gatewayOrderId?: string;
  checkPaymentStatus: CheckPaymentStatusUseCase;
  onBackToWallet: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const refreshWallet = useRefreshWallet();

  /**
   * AC10.13 — a pending charge resolves by polling, not by asking the customer to refresh. The
   * query stops the moment the gateway reports a terminal state, and gives up after
   * `POLL_LIMIT` attempts so a stuck payment does not poll for the life of the screen.
   */
  const poll = useQuery({
    queryKey: ['payment-status', gatewayOrderId],
    enabled: status === 'pending' && Boolean(gatewayOrderId),
    queryFn: async () => {
      const result = await checkPaymentStatus.execute(gatewayOrderId as string);
      if (!result.ok) throw result.error;
      return result.value;
    },
    refetchInterval: (query) =>
      query.state.data === 'PENDING' || query.state.data === undefined
        ? POLL_INTERVAL_MS
        : false,
    retry: POLL_LIMIT,
  });

  const resolved: PaymentOutcome =
    status === 'pending' && poll.data ? outcomeOf(poll.data) : status;

  // AC10.6 / AC10.9 — a settled payment changes the balance, so the wallet's caches are dropped
  // as soon as this screen knows, not when the customer navigates back to it.
  useEffect(() => {
    if (resolved === 'success') void refreshWallet();
  }, [resolved, refreshWallet]);

  const variant = {
    success: {
      background: theme.colors.successAccessible,
      mark: '✓',
      title: t('paySuccess'),
      body: t('paySuccessSub'),
    },
    failed: {
      background: theme.colors.pinkAccessible,
      mark: '✕',
      title: t('payFailed'),
      body: t('payFailedSub'),
    },
    pending: {
      background: theme.colors.warningAccessible,
      mark: '⋯',
      title: t('payPending'),
      body: t('payPendingSub'),
    },
  }[resolved];

  return (
    <Screen
      accessibilityLabel={variant.title}
      background={theme.colors.surface}
      bottomInset
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      <View style={[styles.banner, { backgroundColor: variant.background }]}>
        <View
          style={[
            styles.mark,
            {
              backgroundColor: theme.colors.onDarkMark,
              borderColor: theme.colors.onDarkRing,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Text
            color={theme.colors.textInverse}
            variant="h1"
            weight="extrabold"
          >
            {variant.mark}
          </Text>
        </View>
        <Text
          align="center"
          color={theme.colors.textInverse}
          variant="h3"
          weight="extrabold"
        >
          {variant.title}
        </Text>
        <Text
          align="center"
          color={theme.colors.onDarkPrimary}
          style={styles.copy}
          variant="xs"
        >
          {variant.body}
        </Text>
        <View
          style={[
            styles.amount,
            {
              backgroundColor: theme.colors.onDarkChip,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Text
            color={theme.colors.textInverse}
            latin
            variant="bodyLg"
            weight="extrabold"
          >
            {formatPrice(Number(amount))}
          </Text>
          <Text color={theme.colors.onDarkPrimary} variant="xxs">
            {t('omr')}
          </Text>
        </View>
        {resolved === 'pending' && poll.isFetching ? (
          <Text color={theme.colors.onDarkPrimary} variant="micro">
            {t('payChecking')}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button fullWidth label={t('backToWallet')} onPress={onBackToWallet} />
        {/* AC10.7 / AC10.8 — retry exists on failure and on nothing else. */}
        {resolved === 'failed' ? (
          <Button
            fullWidth
            label={t('tryAgain')}
            variant="secondary"
            onPress={onRetry}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: mobile.payResult.actionsGap,
    paddingHorizontal: mobile.payResult.actionsPadding,
    paddingVertical: mobile.payResult.actionsPaddingY,
  },
  amount: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: mobile.payResult.amountPaddingX,
    paddingVertical: mobile.payResult.amountPaddingY,
  },
  banner: {
    alignItems: 'center',
    gap: mobile.payResult.bannerGap,
    paddingBottom: mobile.payResult.bannerPaddingBottom,
    paddingHorizontal: mobile.payResult.bannerPaddingX,
    paddingTop: mobile.payResult.bannerPaddingTop,
  },
  copy: { maxWidth: mobile.payResult.copyMaxWidth },
  mark: {
    alignItems: 'center',
    borderWidth: mobile.payResult.markBorder,
    height: mobile.payResult.markSize,
    justifyContent: 'center',
    width: mobile.payResult.markSize,
  },
});
