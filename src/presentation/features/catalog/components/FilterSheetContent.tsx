import { StyleSheet, View } from 'react-native';

import { Money } from '@core/money';

import type { ProductSort, SearchCriteria } from '@domain/catalog';

import { Button, Chip, Input, Switch } from '@presentation/components/controls';
import { Text } from '@presentation/components/primitives';
import { Divider } from '@presentation/components/surfaces';
import { useTheme } from '@presentation/theme';

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
  onClear,
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
  onClear: () => void;
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
      <View style={styles.headingRow}>
        <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
          {labels.sortBy}
        </Text>
        <Button
          label={labels.clear}
          variant="ghost"
          size="sm"
          onPress={onClear}
        />
      </View>
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
      <Divider />
      <Switch
        label={labels.inStock}
        value={value.inStock}
        onValueChange={(inStock) => onChange({ ...value, inStock })}
      />
      <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
        {labels.priceRange}
      </Text>
      <View style={[styles.priceRow, { gap: theme.spacing.x3 }]}>
        <View style={styles.flex}>
          <Input
            label={labels.minPrice}
            value={value.minPrice}
            keyboardType="decimal-pad"
            inputDirection="ltr"
            onChangeText={(minPrice) => onChange({ ...value, minPrice })}
          />
        </View>
        <View style={styles.flex}>
          <Input
            label={labels.maxPrice}
            value={value.maxPrice}
            keyboardType="decimal-pad"
            inputDirection="ltr"
            onChangeText={(maxPrice) => onChange({ ...value, maxPrice })}
          />
        </View>
      </View>
      <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
        {labels.rating}
      </Text>
      <View style={styles.ratingRow}>
        {ratings.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
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
      <Button
        label={`${labels.apply} · ${matchCount} ${labels.results}`}
        onPress={() => onApply(filterDraftToCriteria(value))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceRow: { flexDirection: 'row' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
