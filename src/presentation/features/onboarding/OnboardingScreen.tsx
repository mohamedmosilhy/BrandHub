import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createPhoneNumber, type PhoneOtpUseCase } from '@domain/identity';

import { Button, Input } from '@presentation/components/controls';
import { useToast } from '@presentation/components/feedback';
import { Image, Pressable, Text } from '@presentation/components/primitives';
import {
  mobile,
  radius,
  spacing,
  textStart,
  useTheme,
} from '@presentation/theme';

export type OnboardingScreenProps = Readonly<{
  phoneOtp: PhoneOtpUseCase;
  onContinueAsGuest: () => void;
  onEmail: () => void;
}>;

export function OnboardingScreen({
  phoneOtp,
  onContinueAsGuest,
  onEmail,
}: OnboardingScreenProps) {
  const { t } = useTranslation();
  const { theme, isRTL, direction } = useTheme();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    const parsed = createPhoneNumber(`+968${phone}`);
    if (!parsed.ok) {
      setError(t('invalidPhone'));
      return;
    }
    setLoading(true);
    const result = await phoneOtp.send(parsed.value);
    setLoading(false);
    if (!result.ok) {
      setError(t('authNetworkError'));
      return;
    }
    setError(null);
    setChallengeId(result.value.challengeId);
    showToast({ message: t('otpSent'), tone: 'info' });
  }

  async function verifyCode() {
    if (!challengeId) return;
    setLoading(true);
    const result = await phoneOtp.verify(challengeId, code);
    setLoading(false);
    if (!result.ok) {
      setError(t('otpInvalid'));
      return;
    }
    // Mock OTP confirms ownership only; until FA1 adds session tokens this enters as guest.
    onContinueAsGuest();
  }

  const unavailable = () =>
    showToast({ message: t('socialUnavailable'), tone: 'info' });

  return (
    <SafeAreaView
      accessibilityLabel={t('signIn')}
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.ink, direction }]}
    >
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            accessibilityLabel="BRANDHUB marketplace"
            source={require('../../../../design-reference/assets/hero-1.jpg')}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={theme.gradients.onboardingHero.colors}
            end={theme.gradients.onboardingHero.end}
            locations={theme.gradients.onboardingHero.locations}
            pointerEvents="none"
            start={theme.gradients.onboardingHero.start}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.heroCopy,
              {
                gap: theme.mobile.gapItem,
                maxWidth: 300,
              },
            ]}
          >
            <View style={styles.wordmark}>
              <Text
                color={theme.colors.textInverse}
                latin
                variant="display"
                weight="extrabold"
              >
                BRAND
              </Text>
              <Text
                color={theme.colors.onDarkSecondary}
                latin
                variant="display"
                weight="medium"
              >
                HUB
              </Text>
            </View>
            <Text
              color={theme.colors.textInverse}
              variant="bodyLg"
              weight="bold"
            >
              {t('onbTitle')}
            </Text>
            <Text color={theme.colors.onDarkSecondary} variant="xs">
              {t('onbSub')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.actions,
            {
              gap: theme.mobile.gapSection,
              paddingBottom: theme.mobile.onboarding.actionPaddingBottom,
              paddingHorizontal: theme.mobile.onboarding.actionPaddingX,
              paddingTop: theme.mobile.onboarding.actionPaddingTop,
            },
          ]}
        >
          <View
            style={[
              styles.phoneRow,
              {
                backgroundColor: theme.colors.onDarkSurface,
                borderColor: theme.colors.onDarkBorder,
                borderRadius: theme.radius.control,
                gap: theme.mobile.gapItem,
                paddingHorizontal: theme.spacing.x4,
              },
            ]}
          >
            <Text
              color={theme.colors.textInverse}
              latin
              variant="body"
              weight="bold"
            >
              +968
            </Text>
            <View
              style={[
                styles.phoneSeparator,
                { backgroundColor: theme.colors.onDarkBorder },
              ]}
            />
            <TextInput
              accessibilityLabel={t('phone')}
              keyboardType="phone-pad"
              maxLength={8}
              onChangeText={setPhone}
              placeholder={t('phone')}
              placeholderTextColor={theme.colors.onDarkMuted}
              value={phone}
              style={[
                styles.phoneInput,
                {
                  color: theme.colors.textInverse,
                  fontFamily:
                    theme.fontFamilies[isRTL ? 'arabic' : 'latin'].regular,
                  fontSize: theme.fontSizes.body,
                  textAlign: textStart(isRTL),
                },
              ]}
            />
          </View>
          {challengeId ? (
            <Input
              inputDirection="ltr"
              label={t('otpCode')}
              value={code}
              keyboardType="number-pad"
              onChangeText={setCode}
              {...(error ? { error } : {})}
              testID="otp-code"
            />
          ) : error ? (
            <Text
              color={theme.colors.danger}
              variant="xs"
              accessibilityLabel={error}
            >
              {error}
            </Text>
          ) : null}
          <Button
            fullWidth
            loading={loading}
            label={challengeId ? t('verifyOtp') : t('sendOtp')}
            onPress={challengeId ? verifyCode : sendCode}
            style={styles.primaryAction}
          />
          <View
            style={[
              styles.divider,
              { gap: theme.spacing.x3, marginVertical: theme.spacing.x1 },
            ]}
          >
            <View
              style={[
                styles.line,
                { backgroundColor: theme.colors.onDarkBorder },
              ]}
            />
            <Text color={theme.colors.onDarkMuted} variant="xxs">
              {t('or')}
            </Text>
            <View
              style={[
                styles.line,
                { backgroundColor: theme.colors.onDarkBorder },
              ]}
            />
          </View>
          <View style={[styles.social, { gap: theme.mobile.gapItem }]}>
            <Button
              fullWidth
              inverse
              label="Apple"
              size="md"
              variant="secondary"
              onPress={unavailable}
              style={styles.socialButton}
            />
            <Button
              fullWidth
              inverse
              label="Google"
              size="md"
              variant="secondary"
              onPress={unavailable}
              style={styles.socialButton}
            />
          </View>
          <Button
            fullWidth
            inverse
            label={t('email')}
            size="md"
            variant="secondary"
            onPress={onEmail}
            style={styles.emailAction}
          />
          <Pressable
            accessibilityLabel={t('guest')}
            compact
            compactSize={21}
            onPress={onContinueAsGuest}
            style={styles.guest}
          >
            <Text
              align="center"
              color={theme.colors.onDarkSecondary}
              variant="xs"
              weight="semibold"
            >
              {t('guest')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { flexGrow: 1 },
  content: { flexGrow: 1 },
  divider: { alignItems: 'center', flexDirection: 'row' },
  emailAction: { marginTop: mobile.gapHairline },
  guest: { alignSelf: 'center', marginTop: mobile.gapHairline },
  hero: { flexShrink: 0, height: mobile.onboarding.heroHeight },
  heroCopy: {
    bottom: mobile.onboarding.copyBottom,
    position: 'absolute',
    start: mobile.onboarding.copyInsetStart,
  },
  heroImage: { height: '100%', opacity: 0.82, width: '100%' },
  line: { flex: 1, height: 1 },
  phoneRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    height: 52,
  },
  phoneInput: {
    flex: 1,
    height: mobile.fieldHeight + spacing.x1,
    paddingVertical: 0,
    writingDirection: 'ltr',
  },
  phoneSeparator: { height: spacing.x5, width: 1 },
  primaryAction: { borderRadius: radius.control, height: 52 },
  screen: { flex: 1 },
  social: { flexDirection: 'row' },
  socialButton: { flex: 1 },
  wordmark: { flexDirection: 'row', direction: 'ltr' },
});
