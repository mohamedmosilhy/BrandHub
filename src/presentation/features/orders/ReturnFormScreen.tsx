import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { RequestReturnUseCase, ReturnReason } from '@domain/orders';

import { Button, Radio, TextArea } from '@presentation/components/controls';
import { useToast } from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

/** The five fixed reasons the prototype offers, in its order. The mapper turns them into text. */
const REASONS: readonly (readonly [ReturnReason, string])[] = [
  ['NOT_AS_DESCRIBED', 'r1'],
  ['DAMAGED', 'r2'],
  ['WRONG_SIZE', 'r3'],
  ['CHANGED_MIND', 'r4'],
  ['OTHER', 'r5'],
];

export function ReturnFormScreen({
  orderId,
  orderNumber,
  requestReturn,
  onBack,
  onSubmitted,
}: {
  orderId: string;
  orderNumber?: string;
  requestReturn: RequestReturnUseCase;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    // AC9.10 — the block is the use case's (BR8 lives there too); the screen only renders it.
    setError('');
    setBusy(true);
    const result = await requestReturn.execute(orderId, reason, note);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.error.code === 'RETURN_REASON_REQUIRED'
          ? t('returnReasonRequired')
          : t('states:genericErrorBody'),
      );
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['account-metrics'] });
    showToast({ message: t('returnSent'), tone: 'success' });
    onSubmitted();
  }

  return (
    <Screen
      accessibilityLabel={t('returnTitle')}
      background={theme.colors.surface}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader
        title={t('returnTitle')}
        backLabel={t('back')}
        onBack={onBack}
      />
      <View style={styles.page}>
        {orderNumber ? (
          <View
            style={[
              styles.orderRow,
              { backgroundColor: theme.colors.background, borderRadius: 12 },
            ]}
          >
            <Text color={theme.colors.textSecondary} variant="xs">
              {t('orderNo')}
            </Text>
            <Text latin variant="xs" weight="bold">
              {orderNumber}
            </Text>
          </View>
        ) : null}

        <Text variant="sm" weight="extrabold">
          {t('returnReason')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('returnReason')}
          style={styles.reasons}
        >
          {REASONS.map(([value, key]) => (
            <Radio
              key={value}
              label={t(key)}
              selected={reason === value}
              onPress={() => {
                setReason(value);
                setError('');
              }}
            />
          ))}
        </View>

        <TextArea
          label={t('returnNote')}
          value={note}
          onChangeText={setNote}
          {...(error ? { error } : {})}
        />
        <Button
          fullWidth
          label={t('submitReturn')}
          loading={busy}
          onPress={() => void submit()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  page: { gap: 14, padding: 16 },
  reasons: { gap: 8 },
});
