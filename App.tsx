import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
  Heebo_800ExtraBold,
} from '@expo-google-fonts/heebo';
import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import PlaybackScreen from './src/screens/PlaybackScreen';
import SongLibraryScreen from './src/screens/SongLibraryScreen';
import ResultScreen from './src/screens/ResultScreen';
import AudioTestScreen from './src/screens/AudioTestScreen';
import LearningScreen from './src/screens/LearningScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import HelpScreen from './src/screens/HelpScreen';
import AboutScreen from './src/screens/AboutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SupportScreen from './src/screens/SupportScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import mobileAds from 'react-native-google-mobile-ads';
import { LangProvider, useLang } from './src/context/LangContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { HistoryProvider, useHistory } from './src/context/HistoryContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import LeaderboardSync from './src/components/LeaderboardSync';
import { LIGHT_THEME, DARK_THEME } from './src/utils/theme';
import { syncDailyReminder } from './src/utils/dailyReminder';
import { pushLeaderboardScore } from './src/utils/leaderboard';

const Stack = createStackNavigator<RootStackParamList>();

// Rendered inside SettingsProvider so it can react to the dark-mode setting —
// switches the status bar icon color and the native screen-transition background.
function AppContent() {
  const { settings, loaded } = useSettings();
  const { t, lang } = useLang();
  const { passwordRecovery, profile } = useProfile();
  const { points } = useHistory();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [navReady, setNavReady] = useState(false);
  const theme = settings.darkMode ? DARK_THEME : LIGHT_THEME;
  const navTheme = {
    dark: settings.darkMode,
    colors: {
      primary: theme.primary,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  // Keeps the OS-scheduled daily reminder in sync with the Settings toggle/time —
  // reruns (cancel + reschedule, or cancel) whenever either changes, or the
  // language changes (so the notification text follows it).
  useEffect(() => {
    if (!loaded) return;
    syncDailyReminder(settings.dailyReminder, settings.dailyReminderTime, t.dailyReminderNotifTitle, t.dailyReminderNotifBody)
      .then(result => {
        if (result === 'permission-denied') {
          Alert.alert(t.dailyReminderLabel, t.notifPermissionDeniedMsg);
        }
      });
  }, [loaded, settings.dailyReminder, settings.dailyReminderTime, lang]);

  // A reset-password email link signs the user in with a recovery session;
  // take them straight to the choose-a-new-password screen.
  useEffect(() => {
    if (navReady && passwordRecovery) navigationRef.navigate('ResetPassword');
  }, [navReady, passwordRecovery]);

  useEffect(() => { mobileAds().initialize(); }, []);

  // Pushes the local point total to the leaderboard whenever it changes, but
  // only once signed in — signed-out users keep earning points locally, they
  // just don't appear on the shared table until they sign in.
  useEffect(() => {
    if (!profile) return;
    pushLeaderboardScore(profile.id, profile.name, points);
  }, [profile, points]);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)} theme={navTheme}>
      <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="Playback" component={PlaybackScreen} />
        <Stack.Screen name="SongLibrary" component={SongLibraryScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="AudioTest" component={AudioTestScreen} />
        <Stack.Screen name="Learning" component={LearningScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
    Heebo_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7FB' }}>
        <ActivityIndicator size="large" color="#4F6EF7" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <SettingsProvider>
    <HistoryProvider>
    <ProfileProvider>
    <LangProvider>
      <LeaderboardSync />
      <AppContent />
    </LangProvider>
    </ProfileProvider>
    </HistoryProvider>
    </SettingsProvider>
    </SafeAreaProvider>
  );
}
