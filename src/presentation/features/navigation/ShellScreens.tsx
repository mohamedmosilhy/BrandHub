import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

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
