import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Session } from '@domain/identity';

import { Button } from '@presentation/components/controls';
import { Screen } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { Card } from '@presentation/components/surfaces';
import { useTheme } from '@presentation/theme';

export function ShellScreen({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: Readonly<{ label: string; onPress: () => void }>;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Screen accessibilityLabel={title}>
      <View style={{ gap: theme.spacing.x3 }}>
        <Text variant="h2" weight="bold">
          {title}
        </Text>
        {detail ? (
          <Text color={theme.colors.textSecondary}>{detail}</Text>
        ) : null}
      </View>
      <Card>
        <Text color={theme.colors.textSecondary}>{t('phaseComingSoon')}</Text>
      </Card>
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </Screen>
  );
}

export function AccountScreen({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <Screen accessibilityLabel={t('account')}>
      <Text variant="h2" weight="bold">
        {t('account')}
      </Text>
      <Card>
        <View style={{ gap: theme.spacing.x2 }}>
          <Text>
            {`${session.user.firstName} ${session.user.lastName}`.trim()}
          </Text>
          <Text color={theme.colors.textSecondary} variant="sm">
            {`${t('signedInAs')} ${session.user.email}`}
          </Text>
        </View>
      </Card>
      <Button label={t('signOut')} variant="danger" onPress={onSignOut} />
    </Screen>
  );
}
