import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { isAppError } from '@core/errors';

import {
  GIFT_OCCASIONS,
  type Gift,
  type GetSentGiftsUseCase,
  type GiftDraft,
  type GiftOccasion,
  type SendGiftUseCase,
} from '@domain/wallet';

import {
  Button,
  Chip,
  Input,
  TextArea,
} from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import {
  useRefreshWallet,
  useSentGifts,
  walletKeys,
} from '@presentation/features/wallet';
import { formatDate, formatPrice } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

const OCCASION_KEY: Record<GiftOccasion, string> = {
  BIRTHDAY: 'occasion_BIRTHDAY',
  EID: 'occasion_EID',
  GRADUATION: 'occasion_GRADUATION',
  THANK_YOU: 'occasion_THANK_YOU',
};

const BLANK: GiftDraft = {
  recipient: '',
  amount: '',
  occasion: 'BIRTHDAY',
  message: '',
};

export function GiftRow({ gift }: { gift: Gift }) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.gift;
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const occasion = GIFT_OCCASIONS.includes(gift.occasion as GiftOccasion)
    ? t(OCCASION_KEY[gift.occasion as GiftOccasion])
    : gift.occasion;
  return (
    <View
      accessibilityLabel={gift.recipient}
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
          styles.token,
          {
            backgroundColor: theme.colors.pinkLight,
            borderRadius: theme.radius.full,
            height: geometry.tokenSize,
            width: geometry.tokenSize,
          },
        ]}
      >
        <Text color={theme.colors.pinkAccessible} variant="bodyLg">
          ⊕
        </Text>
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} variant="xs" weight="bold">
          {gift.recipient}
        </Text>
        <Text color={theme.colors.textMuted} variant="micro">
          {`${formatDate(gift.createdAt, locale)} · ${occasion}`}
        </Text>
      </View>
      <Text latin variant="price" weight="extrabold">
        {formatPrice(gift.amount.toDecimal())}
      </Text>
    </View>
  );
}

/**
 * `design-reference/BRANDHUB App.dc.html`: recipient, amount, the four occasion pills, a message,
 * the send action, and the gifts already sent.
 */
export function GiftsScreen({
  sendGift,
  getSentGifts,
  onBack,
}: {
  sendGift: SendGiftUseCase;
  getSentGifts: GetSentGiftsUseCase;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const client = useQueryClient();
  const refreshWallet = useRefreshWallet();

  const gifts = useSentGifts(getSentGifts);
  const [draft, setDraft] = useState<GiftDraft>(BLANK);
  const [recipientError, setRecipientError] = useState('');
  const [amountError, setAmountError] = useState('');

  const mutation = useMutation({
    mutationFn: async (input: GiftDraft) => {
      const result = await sendGift.execute(input);
      if (!result.ok) throw result.error;
      return result.value;
    },
    onSuccess: async (gift) => {
      client.setQueryData<readonly Gift[]>(walletKeys.gifts(), (current) => [
        gift,
        ...(current ?? []),
      ]);
      // A gift moves money, so the balance and the history are both stale.
      await refreshWallet();
      await client.invalidateQueries({ queryKey: walletKeys.gifts() });
      showToast({ message: t('giftSent'), tone: 'success' });
      setDraft(BLANK);
    },
    onError: (error: unknown) => {
      const code = isAppError(error) ? error.code : '';
      if (code === 'INVALID_RECIPIENT')
        setRecipientError(t('giftInvalidRecipient'));
      else if (code === 'INVALID_AMOUNT' || code === 'AMOUNT_REQUIRED')
        setAmountError(t('topUpInvalidAmount'));
      else if (code === 'INSUFFICIENT_BALANCE')
        setAmountError(t('giftInsufficientBalance'));
      else showToast({ message: t('giftFailed'), tone: 'error' });
    },
  });

  function change<K extends keyof GiftDraft>(key: K, value: GiftDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setRecipientError('');
    setAmountError('');
  }

  return (
    <Screen
      accessibilityLabel={t('gifts')}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader title={t('gifts')} backLabel={t('back')} onBack={onBack} />
      <View style={styles.page}>
        <Input
          label={t('recipient')}
          placeholder={t('recipient')}
          value={draft.recipient}
          onChangeText={(value) => change('recipient', value)}
          {...(recipientError ? { error: recipientError } : {})}
        />
        <Input
          label={t('amount')}
          inputDirection="ltr"
          keyboardType="decimal-pad"
          placeholder="0.000"
          value={draft.amount}
          onChangeText={(value) => change('amount', value)}
          {...(amountError ? { error: amountError } : {})}
        />

        <View style={styles.field}>
          <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
            {t('occasion')}
          </Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {GIFT_OCCASIONS.map((occasion) => (
              <Chip
                key={occasion}
                label={t(OCCASION_KEY[occasion])}
                selected={draft.occasion === occasion}
                onPress={() => change('occasion', occasion)}
              />
            ))}
          </View>
        </View>

        <TextArea
          label={t('giftNote')}
          placeholder={t('giftNote')}
          value={draft.message}
          onChangeText={(value) => change('message', value)}
        />
        <Button
          fullWidth
          label={t('sendGift')}
          loading={mutation.isPending}
          onPress={() => mutation.mutate(draft)}
        />

        <Text style={styles.historyHeading} variant="sm" weight="extrabold">
          {t('giftHistory')}
        </Text>
        {gifts.isPending ? (
          <>
            <Skeleton accessibilityLabel={t('loading')} height={58} />
            <Skeleton accessibilityLabel={t('loading')} height={58} />
          </>
        ) : gifts.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void gifts.refetch()}
          />
        ) : (gifts.data ?? []).length === 0 ? (
          <EmptyState
            title={t('states:walletEmptyTitle')}
            body={t('states:walletEmptyBody')}
            icon="heart"
          />
        ) : (
          (gifts.data ?? []).map((gift) => (
            <GiftRow key={gift.id} gift={gift} />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: mobile.gift.chipGap },
  field: { gap: mobile.gift.fieldGap },
  historyHeading: { marginTop: mobile.gift.fieldGap },
  page: { gap: mobile.gift.formGap, padding: mobile.gift.formPadding },
  row: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: mobile.gift.rowGap,
  },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  token: { alignItems: 'center', justifyContent: 'center' },
});
