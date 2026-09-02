import { registerRootComponent } from 'expo';

import App from './src/app/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and sets the environment up for both Expo Go and native builds.
registerRootComponent(App);
