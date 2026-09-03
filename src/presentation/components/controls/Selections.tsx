import { useState } from 'react';
import { StyleSheet, Switch as NativeSwitch, View } from 'react-native';

import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { spacing, useTheme } from '@presentation/theme';

export type Choice = { label: string; value: string };

export type SelectProps = {
  label: string;
  accessibilityLabel?: string;
  value?: string;
  placeholder: string;
  options: readonly Choice[];
  onChange?: (value: string) => void;
};

export function Select({
  label,
  accessibilityLabel = label,
  value,
  placeholder,
  options,
  onChange,
}: SelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={{ gap: theme.spacing.x1 }}>
      <Text variant="sm" weight="medium">
        {label}
      </Text>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(selected) }}
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.select,
          {
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.x3,
          },
        ]}
      >
        <Text color={selected ? undefined : theme.colors.textSubtleAccessible}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" color={theme.colors.textSecondary} />
      </Pressable>
      {open ? (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            borderWidth: 1,
          }}
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
              style={{
                justifyContent: 'center',
                paddingHorizontal: theme.spacing.x3,
              }}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export type ChipProps = {
  label: string;
  selected?: boolean;
  removable?: boolean;
  onPress?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
};

export function Chip({
  label,
  selected = false,
  removable = false,
  onPress,
  onRemove,
}: ChipProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.accentLight
            : theme.colors.surface,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.x3,
        },
      ]}
    >
      <Text
        color={selected ? theme.colors.textPrimary : undefined}
        variant="sm"
      >
        {label}
      </Text>
      {removable ? (
        <Pressable
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <Icon name="close" size={theme.iconSizes.sm} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export type SegmentedControlProps = {
  accessibilityLabel: string;
  options: readonly Choice[];
  value: string;
  appearance?: 'track' | 'outline';
  onChange?: (value: string) => void;
};

export function SegmentedControl({
  accessibilityLabel,
  options,
  value,
  appearance = 'track',
  onChange,
}: SegmentedControlProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={[
        styles.segmented,
        {
          backgroundColor:
            appearance === 'track'
              ? theme.colors.background
              : theme.colors.transparent,
          borderRadius: theme.radius.field,
          gap: appearance === 'outline' ? theme.mobile.gapItem : 0,
          padding:
            appearance === 'track' ? theme.mobile.segmentTrackPadding : 0,
        },
      ]}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityLabel={option.label}
          accessibilityRole="radio"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange?.(option.value)}
          style={[
            styles.segment,
            {
              backgroundColor:
                option.value === value
                  ? appearance === 'outline'
                    ? theme.colors.accentLight
                    : theme.colors.surface
                  : theme.colors.transparent,
              borderColor:
                appearance === 'outline'
                  ? option.value === value
                    ? theme.colors.accent
                    : theme.colors.border
                  : theme.colors.transparent,
              borderRadius:
                appearance === 'outline' ? theme.radius.field : theme.radius.md,
              borderWidth: appearance === 'outline' ? 1.5 : 0,
              height:
                appearance === 'outline'
                  ? theme.layout.minimumTouchTarget
                  : theme.mobile.segmentHeight,
              paddingHorizontal: theme.spacing.x3,
            },
          ]}
        >
          <Text
            color={
              appearance === 'track' && option.value !== value
                ? theme.colors.textMuted
                : theme.colors.textPrimary
            }
            variant="xs"
            weight="bold"
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export type SwitchProps = {
  label: string;
  value: boolean;
  onValueChange?: (value: boolean) => void;
};

export function Switch({ label, value, onValueChange }: SwitchProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.switchRow}>
      <Text>{label}</Text>
      <NativeSwitch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onValueChange={onValueChange}
        thumbColor={theme.colors.surface}
        trackColor={{
          false: theme.colors.borderStrong,
          true: theme.colors.accent,
        }}
        value={value}
      />
    </View>
  );
}

type MarkProps = {
  label: string;
  selected: boolean;
  onPress?: (() => void) | undefined;
  kind: 'radio' | 'checkbox';
};

function Mark({ label, selected, onPress, kind }: MarkProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      compact
      compactSize={theme.mobile.checkboxSize}
      onPress={onPress}
      style={styles.markRow}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: selected
            ? theme.colors.accent
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.accent
            : theme.colors.borderStrong,
          borderRadius: kind === 'radio' ? theme.radius.full : theme.radius.sm,
          borderWidth: 1,
          height: theme.mobile.checkboxSize,
          justifyContent: 'center',
          width: theme.mobile.checkboxSize,
        }}
      >
        {selected ? (
          <Icon
            name="check"
            color={theme.colors.textInverse}
            size={theme.iconSizes.xs}
          />
        ) : null}
      </View>
      <Text color={theme.colors.textSecondary} variant="xs">
        {label}
      </Text>
    </Pressable>
  );
}

export function Radio(props: Omit<MarkProps, 'kind'>) {
  return <Mark {...props} kind="radio" />;
}

export function Checkbox(props: Omit<MarkProps, 'kind'>) {
  return <Mark {...props} kind="checkbox" />;
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.x1,
  },
  markRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.x2 },
  remove: { alignItems: 'center', justifyContent: 'center' },
  segment: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  segmented: { flexDirection: 'row' },
  select: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
