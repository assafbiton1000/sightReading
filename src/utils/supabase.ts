import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Keys come from .env (EXPO_PUBLIC_* vars are inlined by Expo at bundle time).
// See docs/AUTH_SETUP.md for how to create the Supabase project and fill them in.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** False until real keys are placed in .env — auth screens show a setup notice instead of failing. */
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20;

// createClient throws on an empty URL, so fall back to a syntactically valid
// placeholder; every call site gates on isSupabaseConfigured before using it.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      // On web supabase-js uses localStorage and parses tokens out of the page
      // URL itself; on native we persist to AsyncStorage and parse deep links
      // manually (ProfileContext).
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

// Native apps get no visibility events, so token auto-refresh must follow the
// foreground/background lifecycle explicitly (per the Supabase RN guide).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
