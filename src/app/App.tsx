/**
 * Composition root.
 *
 * This is the only layer allowed to import from every other layer. Here that
 * means reading validated configuration from `infrastructure` and handing it to
 * a presentation component as plain props, which is the pattern every feature
 * follows once view-models arrive in Phase 5.
 */
import { StatusBar } from 'expo-status-bar';

import { appConfig } from '@infrastructure/config';

import { ComponentGallery } from '@presentation/devtools';
import type { EnvironmentRow } from '@presentation/features/diagnostics';
import { EnvironmentScreen } from '@presentation/features/diagnostics';

import { AppProviders } from '@app/providers';

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
    <AppProviders>
      <StatusBar style="dark" />
      {appConfig.enableDevMenu ? (
        <ComponentGallery />
      ) : (
        <EnvironmentScreen
          title="BRANDHUB · Phase 2"
          environmentName={appConfig.env}
          rows={buildRows()}
        />
      )}
    </AppProviders>
  );
}
