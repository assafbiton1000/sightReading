// Must be the first import so the ignore patterns are registered before
// expo-notifications' import side effects fire the Expo Go push warning.
import './src/utils/ignoreWarnings';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
