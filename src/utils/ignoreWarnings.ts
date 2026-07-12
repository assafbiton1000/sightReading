import { LogBox } from 'react-native';

// Expo Go (SDK 53+) fires this console.error just from importing
// expo-notifications on Android. We only use local notifications, which still
// work in Expo Go — the warning is about remote push, which we don't use.
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
