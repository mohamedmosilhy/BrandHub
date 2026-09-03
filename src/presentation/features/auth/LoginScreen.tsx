import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  createEmail,
  createPhoneNumber,
  type AccountType,
  type Session,
  type SignInUseCase,
  type SignUpUseCase,
} from '@domain/identity';

import {
  Button,
  Checkbox,
  Input,
  PasswordInput,
  SegmentedControl,
} from '@presentation/components/controls';
import { useToast } from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { spacing, useTheme } from '@presentation/theme';

export type AuthMode = 'signin' | 'signup';
type Fields = {
  mode: AuthMode;
  accountType: AccountType;
  name: string;
  email: string;
  phone: string;
  password: string;
  remember: boolean;
};

export type LoginScreenProps = Readonly<{
  initialMode?: AuthMode;
  signIn: SignInUseCase;
  signUp: SignUpUseCase;
  onBack: () => void;
  onUsePhone: () => void;
  onAuthenticated: (session: Session) => void;
}>;

export function LoginScreen({
  initialMode = 'signup',
  signIn,
  signUp,
  onBack,
  onUsePhone,
  onAuthenticated,
}: LoginScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const schema = z
    .object({
      mode: z.enum(['signin', 'signup']),
      accountType: z.enum(['customer', 'seller']),
      name: z.string(),
      email: z.string().email(t('invalidEmail')),
      phone: z.string(),
      password: z.string().min(8, t('passwordMinimum')),
      remember: z.boolean(),
    })
    .superRefine((value, context) => {
      if (value.mode !== 'signup') return;
      if (!value.name.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['name'],
          message: t('requiredField'),
        });
      }
      if (!/^\d{8}$/.test(value.phone.replace(/\s/g, ''))) {
        context.addIssue({
          code: 'custom',
          path: ['phone'],
          message: t('invalidPhone'),
        });
      }
    });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: initialMode,
      accountType: 'customer',
      name: '',
      email: '',
      phone: '',
      password: '',
      remember: true,
    },
  });
  const mode = useWatch({ control, name: 'mode' });
  const accountType = useWatch({ control, name: 'accountType' });
  const remember = useWatch({ control, name: 'remember' });
  const signingUp = mode === 'signup';

  async function submit(values: Fields) {
    setError('root', { message: '' });
    const email = createEmail(values.email);
    if (!email.ok) {
      setError('email', { message: t('invalidEmail') });
      return;
    }
    if (values.mode === 'signin') {
      const result = await signIn.execute({
        email: email.value,
        password: values.password,
      });
      if (result.ok) onAuthenticated(result.value);
      else setError('root', { message: errorMessage(result.error.code, t) });
      return;
    }
    const phone = createPhoneNumber(`+968${values.phone}`);
    if (!phone.ok) {
      setError('phone', { message: t('invalidPhone') });
      return;
    }
    const result = await signUp.execute({
      accountType: values.accountType,
      name: values.name.trim(),
      email: email.value,
      phone: phone.value,
      password: values.password,
    });
    if (!result.ok) {
      setError('root', { message: errorMessage(result.error.code, t) });
    } else if (result.value.kind === 'sellerPendingApproval') {
      showToast({ message: t('sellerPendingToast'), tone: 'success' });
    } else {
      onAuthenticated(result.value.session);
    }
  }

  return (
    <Screen
      keyboardAware
      accessibilityLabel={t(mode === 'signup' ? 'signUp' : 'signIn')}
    >
      <ScreenHeader title="" backLabel={t('back')} onBack={onBack} />
      <View style={styles.heading}>
        <Text variant="h2" weight="bold">
          {t(signingUp ? 'authCreateTitle' : 'authWelcomeBack')}
        </Text>
        <Text color={theme.colors.textSecondary} variant="sm">
          {t(signingUp ? 'authSignUpSubtitle' : 'authSignInSubtitle')}
        </Text>
      </View>
      <SegmentedControl
        accessibilityLabel={t('signIn')}
        value={mode}
        options={[
          { label: t('signIn'), value: 'signin' },
          { label: t('signUp'), value: 'signup' },
        ]}
        onChange={(value) => setValue('mode', value as AuthMode)}
      />
      <Text variant="sm" weight="semibold">
        {t('accountType')}
      </Text>
      <SegmentedControl
        accessibilityLabel={t('accountType')}
        value={accountType}
        options={[
          { label: t('accCustomer'), value: 'customer' },
          { label: t('accSeller'), value: 'seller' },
        ]}
        onChange={(value) => setValue('accountType', value as AccountType)}
      />
      {signingUp ? (
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label={t(accountType === 'seller' ? 'storeName' : 'fullName')}
              onChangeText={field.onChange}
              value={field.value}
              {...(errors.name?.message ? { error: errors.name.message } : {})}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label={t('email')}
            keyboardType="email-address"
            placeholder="name@example.com"
            onChangeText={field.onChange}
            value={field.value}
            {...(errors.email?.message ? { error: errors.email.message } : {})}
            testID="auth-email"
          />
        )}
      />
      {signingUp ? (
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              label={`${t('phone')} (+968)`}
              keyboardType="phone-pad"
              onChangeText={field.onChange}
              value={field.value}
              {...(errors.phone?.message
                ? { error: errors.phone.message }
                : {})}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <PasswordInput
            label={t('password')}
            onChangeText={field.onChange}
            value={field.value}
            {...(errors.password?.message
              ? { error: errors.password.message }
              : {})}
            testID="auth-password"
          />
        )}
      />
      <View style={styles.formMeta}>
        <Checkbox
          label={t('remember')}
          selected={remember}
          onPress={() => setValue('remember', !remember)}
        />
        <Pressable accessibilityLabel={t('forgot')}>
          <Text color={theme.colors.accentHover} variant="sm" weight="semibold">
            {t('forgot')}
          </Text>
        </Pressable>
      </View>
      {signingUp && accountType === 'seller' ? (
        <View
          style={{
            backgroundColor: theme.colors.warningLight,
            borderRadius: theme.radius.md,
            padding: theme.spacing.x3,
          }}
        >
          <Text color={theme.colors.warningAccessible} variant="sm">
            {t('sellerPending')}
          </Text>
        </View>
      ) : null}
      {errors.root?.message ? (
        <Text
          accessibilityLabel={errors.root.message}
          color={theme.colors.dangerAccessible}
          variant="sm"
        >
          {errors.root.message}
        </Text>
      ) : null}
      <Button
        fullWidth
        loading={isSubmitting}
        label={t(signingUp ? 'createAccount' : 'signIn')}
        onPress={() => void handleSubmit(submit)()}
        testID="auth-submit"
      />
      <Button
        fullWidth
        label={t('usePhoneInstead')}
        variant="secondary"
        onPress={onUsePhone}
      />
      <Pressable accessibilityLabel={t('adminLogin')} style={styles.admin}>
        <Text color={theme.colors.textSecondary} variant="sm" weight="semibold">
          {t('adminLogin')}
        </Text>
      </Pressable>
    </Screen>
  );
}

function errorMessage(code: string, t: (key: string) => string): string {
  if (code === 'INVALID_CREDENTIALS') return t('invalidCredentials');
  if (code.startsWith('NETWORK_')) return t('authNetworkError');
  return t('authGenericError');
}

const styles = StyleSheet.create({
  admin: { alignSelf: 'center' },
  formMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: { gap: spacing.x1 },
});
