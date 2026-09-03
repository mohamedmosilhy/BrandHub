import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@presentation/components/controls';
import { Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

/**
 * `design-reference/BRANDHUB App.dc.html`: `padding: 12px 16px; border-top: 1px solid #E8E8EC`
 * with two 50 px actions, the outlined add and the filled buy. The hint line above them is
 * Phase 7's, and only appears when D8 has something to say — a variant still to be chosen, or
 * a sold-out selection.
 */
export function BuyBar({
  hint,
  disabled,
  onAddToCart,
  onBuyNow,
}: {
  hint: string | null;
  disabled: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {hint ? (
        <Text color={theme.colors.textMuted} variant="micro">
          {hint}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          disabled={disabled}
          fullWidth
          label={t('addToCart')}
          size="lg"
          style={styles.action}
          variant="secondary"
          onPress={onAddToCart}
        />
        <Button
          disabled={disabled}
          fullWidth
          label={t('buyNow')}
          size="lg"
          style={styles.action}
          onPress={onBuyNow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  bar: {
    borderTopWidth: 1,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
