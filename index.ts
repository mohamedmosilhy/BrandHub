import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

import App from './src/app/App';
import { bootstrapDirection, i18n } from './src/infrastructure/i18n';

bootstrapDirection(i18n.language);
void SplashScreen.preventAutoHideAsync();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and sets the environment up for both Expo Go and native builds.
registerRootComponent(App);
