import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { spacing, useTheme } from '@presentation/theme';

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
  onChangeText?: (value: string) => void;
  testID?: string;
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
  onChangeText,
  testID,
}: InputProps) {
  const { i18n } = useTranslation();
  const { theme, isRTL } = useTheme();
  const arabic = i18n.language === 'ar';
  return (
    <View style={styles.field}>
      <Text variant="sm" weight="medium">
        {label}
      </Text>
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
        placeholderTextColor={theme.colors.textSubtleAccessible}
        secureTextEntry={secureTextEntry}
        testID={testID}
        value={value}
        style={[
          styles.input,
          {
            backgroundColor: disabled
              ? theme.colors.background
              : theme.colors.surface,
            borderColor: error
              ? theme.colors.dangerAccessible
              : theme.colors.borderStrong,
            borderRadius: theme.radius.md,
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamilies[arabic ? 'arabic' : 'latin'].regular,
            fontSize: theme.fontSizes.body,
            minHeight: multiline
              ? theme.spacing.x20
              : theme.layout.minimumTouchTarget,
            paddingHorizontal: theme.spacing.x3,
            paddingVertical: theme.spacing.x2,
            textAlign: 'auto',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}
      />
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
  const { theme } = useTheme();
  return (
    <View>
      <Input {...props} secureTextEntry={!visible} />
      <View style={[styles.passwordAction, { marginTop: theme.spacing.x2 }]}>
        <Pressable
          accessibilityLabel={
            visible
              ? (hidePasswordLabel ?? t('hidePassword'))
              : (showPasswordLabel ?? t('showPassword'))
          }
          onPress={() => setVisible((current) => !current)}
          style={styles.iconAction}
          testID="password-visibility-toggle"
        >
          <Icon
            name={visible ? 'eye-off' : 'eye'}
            testID={visible ? 'password-visible-icon' : 'password-hidden-icon'}
          />
        </Pressable>
      </View>
    </View>
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
  field: { gap: spacing.x1 },
  iconAction: { alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1 },
  passwordAction: { position: 'absolute', end: 0 },
  searchField: { position: 'relative' },
  searchIcon: { position: 'absolute', end: 0, zIndex: 1 },
});
