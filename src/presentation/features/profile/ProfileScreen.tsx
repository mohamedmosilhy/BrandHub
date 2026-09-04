import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Session, UpdateProfileUseCase } from '@domain/identity';

import { Button, Input } from '@presentation/components/controls';
import { useToast } from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Avatar } from '@presentation/components/surfaces';

export function ProfileScreen({
  session,
  updateProfile,
  onBack,
  onUpdated,
}: {
  session: Session;
  updateProfile: UpdateProfileUseCase;
  onBack: () => void;
  onUpdated: (session: Session) => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState(session.user.firstName);
  const [lastName, setLastName] = useState(session.user.lastName);
  const [phone, setPhone] = useState(session.user.phone ?? '+968');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    const result = await updateProfile.execute({
      firstName,
      lastName,
      email: session.user.email,
      phone,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError('');
    // The account header reads the session store, so the updated session goes back before the
    // screen pops (AC9.17).
    onUpdated(result.value);
    showToast({ message: t('profileSaved'), tone: 'success' });
    onBack();
  }

  return (
    <Screen
      accessibilityLabel={t('profile')}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader
        title={t('profile')}
        backLabel={t('cancel')}
        onBack={onBack}
      />
      <View style={styles.avatar}>
        <Avatar
          accessibilityLabel={`${firstName} ${lastName}`.trim()}
          initials={`${firstName[0] ?? ''}${lastName[0] ?? ''}`}
          size="lg"
        />
      </View>
      <View style={styles.form}>
        <Input
          label={t('firstName')}
          value={firstName}
          onChangeText={setFirstName}
        />
        <Input
          label={t('lastName')}
          value={lastName}
          onChangeText={setLastName}
        />
        <Input
          label={t('phoneLabel')}
          inputDirection="ltr"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {/* `PUT /users/me` does not accept an email, so the field shows the account's address
            without offering an edit the contract cannot honour. */}
        <Input
          label={t('email')}
          disabled
          inputDirection="ltr"
          value={session.user.email}
          {...(error ? { error } : {})}
        />
        <View style={styles.actions}>
          <Button label={t('cancel')} variant="secondary" onPress={onBack} />
          <Button
            label={t('save')}
            loading={busy}
            onPress={() => void save()}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  avatar: { alignItems: 'center', paddingTop: 20 },
  form: { gap: 13, padding: 16 },
});
