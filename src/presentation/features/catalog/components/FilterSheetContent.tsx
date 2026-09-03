import { StyleSheet, TextInput, View } from 'react-native';

import { Money } from '@core/money';

import type { ProductSort, SearchCriteria } from '@domain/catalog';

import { Button, Chip, Switch } from '@presentation/components/controls';
import { Text } from '@presentation/components/primitives';
import { Divider } from '@presentation/components/surfaces';
import { textStart, useTheme, writingDirection } from '@presentation/theme';

export type FilterDraft = Readonly<{
  sort: ProductSort;
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
  minRating?: number;
}>;

export const emptyFilterDraft: FilterDraft = {
  sort: 'relevance',
  inStock: false,
  minPrice: '',
  maxPrice: '',
};

export function filterDraftToCriteria(draft: FilterDraft): SearchCriteria {
  const min = Number(draft.minPrice);
  const max = Number(draft.maxPrice);
  return {
    sort: draft.sort,
    ...(draft.inStock ? { inStock: true } : {}),
    ...(draft.minPrice.trim() && Number.isFinite(min) && min >= 0
      ? { minPrice: Money.fromDecimal(draft.minPrice) }
      : {}),
    ...(draft.maxPrice.trim() && Number.isFinite(max) && max >= 0
      ? { maxPrice: Money.fromDecimal(draft.maxPrice) }
      : {}),
    ...(draft.minRating !== undefined ? { minRating: draft.minRating } : {}),
  };
}

export function FilterSheetContent({
  value,
  matchCount,
  labels,
  onChange,
  onApply,
}: {
  value: FilterDraft;
  matchCount: number;
  labels: Readonly<{
    sortBy: string;
    relevance: string;
    topRated: string;
    priceAsc: string;
    priceDesc: string;
    inStock: string;
    priceRange: string;
    minPrice: string;
    maxPrice: string;
    rating: string;
    rating4: string;
    rating3: string;
    rating2: string;
    clear: string;
    apply: string;
    results: string;
  }>;
  onChange: (value: FilterDraft) => void;
  onApply: (criteria: SearchCriteria) => void;
}) {
  const { theme } = useTheme();
  const sorts: readonly { value: ProductSort; label: string }[] = [
    { value: 'relevance', label: labels.relevance },
    { value: 'top-rated', label: labels.topRated },
    { value: 'price-asc', label: labels.priceAsc },
    { value: 'price-desc', label: labels.priceDesc },
  ];
  const ratings = [
    { value: 4, label: labels.rating4 },
    { value: 3, label: labels.rating3 },
    { value: 2, label: labels.rating2 },
  ] as const;
  return (
    <View style={{ gap: theme.spacing.x4 }}>
      <View style={{ gap: theme.mobile.gapHairline + 3 }}>
        <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
          {labels.sortBy}
        </Text>
        <View style={styles.wrap}>
          {sorts.map((sort) => (
            <Chip
              key={sort.value}
              label={sort.label}
              selected={value.sort === sort.value}
              onPress={() => onChange({ ...value, sort: sort.value })}
            />
          ))}
        </View>
      </View>
      <Divider />
      {/*
        The prototype's second toggle here is "Hub Express only". D21 holds it back until the
        API carries a trustworthy express flag (GAP-6/GAP-15), so this sheet ships one toggle.
      */}
      <Switch
        label={labels.inStock}
        value={value.inStock}
        onValueChange={(inStock) => onChange({ ...value, inStock })}
      />
      <View style={{ gap: theme.mobile.gapHairline + 3 }}>
        <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
          {labels.priceRange}
        </Text>
        <View style={[styles.priceRow, { gap: theme.mobile.gapItem }]}>
          <View style={styles.flex}>
            <InlineAmountField
              label={labels.minPrice}
              value={value.minPrice}
              onChangeText={(minPrice) => onChange({ ...value, minPrice })}
            />
          </View>
          <View
            style={[
              styles.dash,
              { backgroundColor: theme.colors.borderStrong },
            ]}
          />
          <View style={styles.flex}>
            <InlineAmountField
              label={labels.maxPrice}
              value={value.maxPrice}
              onChangeText={(maxPrice) => onChange({ ...value, maxPrice })}
            />
          </View>
        </View>
      </View>
      <View style={{ gap: theme.mobile.gapHairline + 3 }}>
        <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
          {labels.rating}
        </Text>
        <View style={styles.ratingRow}>
          {ratings.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              shape="block"
              selected={value.minRating === item.value}
              onPress={() => {
                if (value.minRating === item.value) {
                  const { minRating: _removed, ...rest } = value;
                  onChange(rest);
                } else {
                  onChange({ ...value, minRating: item.value });
                }
              }}
            />
          ))}
        </View>
      </View>
      <Button
        fullWidth
        label={`${labels.apply} · ${matchCount} ${labels.results}`}
        onPress={() => onApply(filterDraftToCriteria(value))}
      />
    </View>
  );
}

/**
 * The prototype's price field is one 44 px row holding a 10 px caption and the value, not a
 * label stacked above an input.
 */
function InlineAmountField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.amountField,
        {
          backgroundColor: theme.colors.surfaceField,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.field,
        },
      ]}
    >
      <Text color={theme.colors.textMuted} variant="micro">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        value={value}
        style={[
          styles.amountInput,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamilies.latin.bold,
            fontSize: theme.fontSizes.body,
            // A price is a Latin run: it stays LTR whatever the app's reading direction.
            direction: 'ltr',
            textAlign: textStart(),
            writingDirection: writingDirection(false),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  amountField: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
  },
  amountInput: { flex: 1, minWidth: 0, paddingVertical: 0 },
  dash: { height: 1, width: 10 },
  flex: { flex: 1 },
  priceRow: { alignItems: 'center', flexDirection: 'row' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
