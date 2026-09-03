import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBar } from 'expo-status-bar';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { mobile, radius, spacing, useTheme } from '@presentation/theme';

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
  const { theme, direction } = useTheme();
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
    <SafeAreaView
      accessibilityLabel={t(mode === 'signup' ? 'signUp' : 'signIn')}
      edges={['top', 'bottom']}
      style={[
        styles.safe,
        { backgroundColor: theme.colors.surface, direction },
      ]}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safe}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authHeader}>
            <Pressable
              accessibilityLabel={t('back')}
              onPress={onBack}
              style={styles.backAction}
            >
              <Icon name="arrow-back" />
            </Pressable>
          </View>
          <View style={styles.heading}>
            <Text variant="h1" weight="extrabold">
              {t(signingUp ? 'authCreateTitle' : 'authWelcomeBack')}
            </Text>
            <Text color={theme.colors.textMuted} variant="xs">
              {t(signingUp ? 'authSignUpSubtitle' : 'authSignInSubtitle')}
            </Text>
          </View>
          <View style={styles.modeSwitch}>
            <SegmentedControl
              accessibilityLabel={t('signIn')}
              value={mode}
              options={[
                { label: t('signIn'), value: 'signin' },
                { label: t('signUp'), value: 'signup' },
              ]}
              onChange={(value) => setValue('mode', value as AuthMode)}
            />
          </View>
          <View style={styles.accountType}>
            <Text
              color={theme.colors.textSecondary}
              variant="xxs"
              weight="bold"
            >
              {t('accountType')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('accountType')}
              appearance="outline"
              value={accountType}
              options={[
                { label: t('accCustomer'), value: 'customer' },
                { label: t('accSeller'), value: 'seller' },
              ]}
              onChange={(value) =>
                setValue('accountType', value as AccountType)
              }
            />
          </View>
          <View style={styles.form}>
            {signingUp ? (
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <Input
                    label={t(
                      accountType === 'seller' ? 'storeName' : 'fullName',
                    )}
                    onChangeText={field.onChange}
                    value={field.value}
                    {...(errors.name?.message
                      ? { error: errors.name.message }
                      : {})}
                  />
                )}
              />
            ) : null}
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  inputDirection="ltr"
                  label={t('email')}
                  keyboardType="email-address"
                  placeholder="name@example.com"
                  onChangeText={field.onChange}
                  value={field.value}
                  {...(errors.email?.message
                    ? { error: errors.email.message }
                    : {})}
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
                    accessibilityLabel={`${t('phone')} (+968)`}
                    inputDirection="ltr"
                    label={t('phone')}
                    keyboardType="phone-pad"
                    placeholder="+968 9xxx xxxx"
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
              <Pressable
                accessibilityLabel={t('forgot')}
                compact
                compactSize={spacing.x5}
              >
                <Text
                  color={theme.colors.accentHover}
                  variant="xs"
                  weight="bold"
                >
                  {t('forgot')}
                </Text>
              </Pressable>
            </View>
            {signingUp && accountType === 'seller' ? (
              <View
                style={[
                  styles.sellerNote,
                  {
                    backgroundColor: theme.colors.warningLight,
                    borderRadius: theme.radius.field,
                  },
                ]}
              >
                <Text color={theme.colors.warningAccessible} variant="xxs">
                  {t('sellerPending')}
                </Text>
              </View>
            ) : null}
            {errors.root?.message ? (
              <Text
                accessibilityLabel={errors.root.message}
                color={theme.colors.dangerAccessible}
                variant="xs"
              >
                {errors.root.message}
              </Text>
            ) : null}
            <Button
              fullWidth
              loading={isSubmitting}
              label={t(signingUp ? 'createAccount' : 'signIn')}
              onPress={() => void handleSubmit(submit)()}
              style={styles.submit}
              testID="auth-submit"
            />
            <View style={styles.divider}>
              <View
                style={[styles.line, { backgroundColor: theme.colors.border }]}
              />
              <Text color={theme.colors.textMuted} variant="xxs">
                {t('or')}
              </Text>
              <View
                style={[styles.line, { backgroundColor: theme.colors.border }]}
              />
            </View>
            <Button
              fullWidth
              label={t('sendOtp')}
              size="md"
              variant="secondary"
              onPress={onUsePhone}
            />
            <Pressable
              accessibilityLabel={t('adminLogin')}
              compact
              compactSize={spacing.x5}
              style={styles.admin}
            >
              <Text
                align="center"
                color={theme.colors.textSecondary}
                variant="xs"
                weight="bold"
              >
                {t('adminLogin')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function errorMessage(code: string, t: (key: string) => string): string {
  if (code === 'INVALID_CREDENTIALS') return t('invalidCredentials');
  if (code.startsWith('NETWORK_')) return t('authNetworkError');
  return t('authGenericError');
}

const styles = StyleSheet.create({
  accountType: {
    gap: spacing.x3,
    marginHorizontal: mobile.auth.gutter,
    marginTop: mobile.auth.sectionTop,
  },
  admin: { alignSelf: 'center', paddingTop: mobile.gapHairline },
  authHeader: {
    height: mobile.auth.headerHeight,
    justifyContent: 'center',
    paddingHorizontal: spacing.x4,
  },
  backAction: { alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingBottom: mobile.auth.screenBottom },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.x3,
    marginVertical: mobile.gapHairline,
  },
  form: {
    gap: spacing.x3,
    paddingHorizontal: mobile.auth.gutter,
    paddingTop: mobile.auth.sectionTop,
  },
  formMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heading: {
    gap: mobile.gapHairline,
    paddingBottom: mobile.auth.sectionTop,
    paddingHorizontal: mobile.auth.gutter,
    paddingTop: spacing.x1,
  },
  line: { flex: 1, height: 1 },
  modeSwitch: { marginHorizontal: mobile.auth.gutter },
  safe: { flex: 1 },
  sellerNote: {
    paddingHorizontal: mobile.auth.notePaddingX,
    paddingVertical: spacing.x3,
  },
  submit: { borderRadius: radius.control, marginTop: spacing.x1 },
});
