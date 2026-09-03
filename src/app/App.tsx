import { StatusBar } from 'expo-status-bar';

import { AppNavigator } from '@app/navigation';
import { AppProviders } from '@app/providers';

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <AppNavigator />
    </AppProviders>
  );
}
