import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { formatPrice } from '@presentation/formatting';
import { spacing, useTheme } from '@presentation/theme';

export type QuantityStepperProps = {
  value: number;
  accessibilityLabel: string;
  onChange?: (value: number) => void;
  onRemove?: () => void;
};

export function QuantityStepper({
  value,
  accessibilityLabel,
  onChange,
  onRemove,
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const decrement = () => {
    if (value <= 1) onRemove?.();
    else onChange?.(value - 1);
  };
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.stepper,
        { borderColor: theme.colors.border, borderRadius: theme.radius.md },
      ]}
    >
      <Pressable
        accessibilityLabel={t('decrease')}
        onPress={decrement}
        style={styles.stepAction}
      >
        <Icon name={value <= 1 ? 'close' : 'minus'} size={theme.iconSizes.sm} />
      </Pressable>
      <Text accessibilityLabel={`${value}`} weight="semibold">
        {value}
      </Text>
      <Pressable
        accessibilityLabel={t('increase')}
        onPress={() => onChange?.(value + 1)}
        style={styles.stepAction}
      >
        <Icon name="plus" size={theme.iconSizes.sm} />
      </Pressable>
    </View>
  );
}

export type RatingStarsProps = {
  rating: number;
  accessibilityLabel?: string;
  max?: number;
};

export function RatingStars({
  rating,
  accessibilityLabel,
  max = 5,
}: RatingStarsProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${rating} out of ${max}`}
      accessibilityRole="image"
      style={styles.rating}
    >
      {Array.from({ length: max }, (_, index) => (
        <Icon
          key={index}
          name="star"
          color={
            index < Math.round(rating)
              ? theme.colors.rating
              : theme.colors.borderStrong
          }
          filled={index < Math.round(rating)}
          size={theme.iconSizes.sm}
        />
      ))}
    </View>
  );
}

export type PriceTextProps = {
  amount: number;
  locale?: 'ar' | 'en';
  originalAmount?: number;
  accessibilityLabel?: string;
};

export function PriceText({
  amount,
  locale,
  originalAmount,
  accessibilityLabel,
}: PriceTextProps) {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const resolvedLocale = locale ?? (i18n.language === 'ar' ? 'ar' : 'en');
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.price}>
      <Text color={theme.colors.accent} variant="bodyLg" weight="bold">
        {resolvedLocale === 'ar'
          ? `${formatPrice(amount)} ر.ع.`
          : `OMR ${formatPrice(amount)}`}
      </Text>
      {originalAmount === undefined ? null : (
        <Text
          color={theme.colors.textSubtleAccessible}
          variant="xs"
          style={styles.strike}
        >
          {resolvedLocale === 'ar'
            ? `${formatPrice(originalAmount)} ر.ع.`
            : `OMR ${formatPrice(originalAmount)}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  price: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.x2 },
  rating: { flexDirection: 'row', gap: spacing.x1 },
  stepAction: { alignItems: 'center', justifyContent: 'center' },
  stepper: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.x3,
  },
  strike: { textDecorationLine: 'line-through' },
});
