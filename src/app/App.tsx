/**
 * Composition root.
 *
 * This is the only layer allowed to import from every other layer. Here that
 * means reading validated configuration from `infrastructure` and handing it to
 * a presentation component as plain props, which is the pattern every feature
 * follows once view-models arrive in Phase 5.
 */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { appConfig } from '@infrastructure/config';

import type { EnvironmentRow } from '@presentation/features/diagnostics';
import { EnvironmentScreen } from '@presentation/features/diagnostics';
import { colors } from '@presentation/theme';

function buildRows(): readonly EnvironmentRow[] {
  return [
    { label: 'API base URL', value: appConfig.apiBaseUrl },
    { label: 'Default locale', value: appConfig.defaultLocale },
    { label: 'Request timeout', value: `${appConfig.requestTimeoutMs} ms` },
    {
      label: 'Dev menu',
      value: appConfig.enableDevMenu ? 'enabled' : 'disabled',
    },
  ];
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <EnvironmentScreen
          title="BRANDHUB · Phase 1"
          environmentName={appConfig.env}
          rows={buildRows()}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
