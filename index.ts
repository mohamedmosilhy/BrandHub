import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

import App from './src/app/App';
import {
  bootstrapDirection,
  i18n,
  loadPersistedLanguage,
} from './src/infrastructure/i18n';

void SplashScreen.preventAutoHideAsync();

/**
 * The persisted language decides the layout direction, and `I18nManager.forceRTL` has to be set
 * before the first render, so the root component is registered only once the stored locale is
 * known (AC9.18).
 */
void loadPersistedLanguage().then(async (locale) => {
  await i18n.changeLanguage(locale);
  bootstrapDirection(locale);
  // registerRootComponent calls AppRegistry.registerComponent('main', () => App)
  // and sets the environment up for both Expo Go and native builds.
  registerRootComponent(App);
});
