import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { createPhoneNumber, type PhoneOtpUseCase } from '@domain/identity';

import { Button, Input } from '@presentation/components/controls';
import { useToast } from '@presentation/components/feedback';
import { Image, Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

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
  const { theme, isRTL } = useTheme();
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
    <View
      accessibilityLabel={t('signIn')}
      style={[styles.screen, { backgroundColor: theme.colors.ink }]}
    >
      <View style={styles.hero}>
        <Image
          accessibilityLabel="BRANDHUB marketplace"
          source={require('../../../../design-reference/assets/hero-1.jpg')}
          style={styles.heroImage}
        />
        <View
          style={[
            styles.heroCopy,
            {
              backgroundColor: theme.colors.ink80,
              gap: theme.spacing.x2,
              padding: theme.spacing.x6,
            },
          ]}
        >
          <Text color={theme.colors.textInverse} variant="h2" weight="bold">
            BRANDHUB
          </Text>
          <Text color={theme.colors.textInverse} variant="bodyLg" weight="bold">
            {t('onbTitle')}
          </Text>
          <Text color={theme.colors.borderStrong} variant="sm">
            {t('onbSub')}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.actions,
          { gap: theme.spacing.x3, padding: theme.spacing.x6 },
        ]}
      >
        <View
          style={[
            styles.phoneRow,
            {
              backgroundColor: theme.colors.ink10,
              borderColor: theme.colors.ink40,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.x4,
            },
          ]}
        >
          <Text
            color={theme.colors.textInverse}
            weight="bold"
            style={styles.ltr}
          >
            +968
          </Text>
          <TextInput
            accessibilityLabel={t('phone')}
            keyboardType="phone-pad"
            maxLength={8}
            onChangeText={setPhone}
            placeholder={t('phone')}
            placeholderTextColor={theme.colors.textMuted}
            value={phone}
            style={{
              color: theme.colors.textInverse,
              flex: 1,
              fontFamily:
                theme.fontFamilies[isRTL ? 'arabic' : 'latin'].regular,
              writingDirection: 'ltr',
            }}
          />
        </View>
        {challengeId ? (
          <Input
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
        />
        <View style={[styles.divider, { gap: theme.spacing.x3 }]}>
          <View
            style={[styles.line, { backgroundColor: theme.colors.ink40 }]}
          />
          <Text color={theme.colors.textMuted} variant="xs">
            {t('or')}
          </Text>
          <View
            style={[styles.line, { backgroundColor: theme.colors.ink40 }]}
          />
        </View>
        <View style={[styles.social, { gap: theme.spacing.x2 }]}>
          <Button
            fullWidth
            label="Apple"
            variant="secondary"
            onPress={unavailable}
          />
          <Button
            fullWidth
            label="Google"
            variant="secondary"
            onPress={unavailable}
          />
        </View>
        <Button
          fullWidth
          label={t('email')}
          variant="secondary"
          onPress={onEmail}
        />
        <Pressable
          accessibilityLabel={t('guest')}
          onPress={onContinueAsGuest}
          style={styles.guest}
        >
          <Text
            color={theme.colors.borderStrong}
            variant="sm"
            weight="semibold"
          >
            {t('guest')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flex: 1 },
  divider: { alignItems: 'center', flexDirection: 'row' },
  guest: { alignSelf: 'center' },
  hero: { height: 384 },
  heroCopy: { bottom: 0, position: 'absolute', start: 0, end: 0 },
  heroImage: { height: '100%', width: '100%' },
  line: { flex: 1, height: 1 },
  ltr: { writingDirection: 'ltr' },
  phoneRow: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  screen: { flex: 1 },
  social: { flexDirection: 'row' },
});
