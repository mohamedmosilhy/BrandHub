import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { Icon, Pressable, Text } from '@presentation/components/primitives';
import {
  mobile,
  spacing,
  textStart,
  useTheme,
  writingDirection,
} from '@presentation/theme';

export type InputProps = {
  label: string;
  accessibilityLabel?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: KeyboardTypeOptions;
  inputDirection?: 'locale' | 'ltr';
  onChangeText?: (value: string) => void;
  testID?: string;
  trailing?: ReactNode;
};

export function Input({
  label,
  accessibilityLabel = label,
  value,
  placeholder,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  keyboardType,
  inputDirection = 'locale',
  onChangeText,
  testID,
  trailing,
}: InputProps) {
  const { theme, isRTL } = useTheme();
  const runRTL = inputDirection === 'locale' && isRTL;
  const arabic = runRTL;
  return (
    <View style={styles.field}>
      <Text variant="xxs" weight="bold">
        {label}
      </Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: disabled
              ? theme.colors.background
              : theme.colors.surfaceField,
            borderColor: error
              ? theme.colors.dangerAccessible
              : theme.colors.border,
            borderRadius: theme.radius.field,
            minHeight: multiline ? theme.spacing.x20 : theme.mobile.fieldHeight,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="text"
          accessibilityState={{ disabled }}
          editable={!disabled}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secureTextEntry}
          testID={testID}
          value={value}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontFamily:
                theme.fontFamilies[arabic ? 'arabic' : 'latin'].regular,
              fontSize: theme.fontSizes.sm,
              minHeight: multiline
                ? theme.spacing.x20
                : theme.mobile.fieldHeight - 2,
              paddingHorizontal: theme.mobile.gapSection,
              textAlign: textStart(runRTL),
              writingDirection: writingDirection(runRTL),
            },
          ]}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <Text
          accessibilityLabel={error}
          color={theme.colors.dangerAccessible}
          variant="xs"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function PasswordInput({
  showPasswordLabel,
  hidePasswordLabel,
  ...props
}: Omit<InputProps, 'secureTextEntry'> & {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <Input
      {...props}
      inputDirection="ltr"
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityLabel={
            visible
              ? (hidePasswordLabel ?? t('hidePassword'))
              : (showPasswordLabel ?? t('showPassword'))
          }
          onPress={() => setVisible((current) => !current)}
          compact
          compactSize={mobile.iconButtonSize}
          style={styles.iconAction}
          testID="password-visibility-toggle"
        >
          <Icon
            name={visible ? 'eye-off' : 'eye'}
            testID={visible ? 'password-visible-icon' : 'password-hidden-icon'}
          />
        </Pressable>
      }
    />
  );
}

export function TextArea(props: Omit<InputProps, 'multiline'>) {
  return <Input {...props} multiline numberOfLines={4} />;
}

export type SearchFieldProps = Omit<InputProps, 'label'> & { label?: string };

export function SearchField({ label = 'Search', ...props }: SearchFieldProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.searchField}>
      <View style={[styles.searchIcon, { marginTop: theme.spacing.x10 }]}>
        <Icon name="search" color={theme.colors.textSecondary} />
      </View>
      <Input {...props} label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: mobile.gapHairline },
  iconAction: { alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: 0 },
  inputShell: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  searchField: { position: 'relative' },
  searchIcon: { position: 'absolute', end: 0, zIndex: 1 },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.x2,
  },
});
