import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

// Closes the web OAuth popup once the provider redirects back (no-op on native).
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  name: string;
  email: string;
  joinedAt: number;
}

/** Stable error codes the UI translates via i18n — never show raw Supabase messages. */
export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'user-exists'
  | 'weak-password'
  | 'network'
  | 'cancelled'
  | 'not-configured'
  | 'unknown';

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };
export type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; error: AuthErrorCode };

interface ProfileCtx {
  loaded: boolean;
  /** Derived from the Supabase session; null = signed out. */
  profile: UserProfile | null;
  /** False until real API keys are placed in .env — auth UI shows a setup notice. */
  configured: boolean;
  /** Set when the user arrives through a reset-password email link; App navigates to ResetPassword. */
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateProfile: (patch: { name: string }) => Promise<AuthResult>;
  /** Permanently deletes the signed-in account server-side (docs/AUTH_SETUP.md §6), then clears the local session. */
  deleteAccount: () => Promise<AuthResult>;
  logout: () => void;
}

const Ctx = createContext<ProfileCtx | null>(null);

function profileFromSession(session: Session | null): UserProfile | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  // Google accounts arrive with full_name; email sign-ups store name at registration.
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (u.email ? u.email.split('@')[0] : '');
  return { name, email: u.email ?? '', joinedAt: Date.parse(u.created_at) || Date.now() };
}

function mapError(error: { message?: string; code?: string } | AuthError | null | undefined): AuthErrorCode {
  if (!error) return 'unknown';
  const code = (error as { code?: string }).code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'invalid-credentials';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'email-not-confirmed';
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'user-exists';
  if (code === 'weak_password' || msg.includes('password should be')) return 'weak-password';
  if (msg.includes('fetch') || msg.includes('network')) return 'network';
  return 'unknown';
}

// Where auth emails / the OAuth provider send the user back to. On web that's
// the site itself (supabase-js picks the tokens out of the URL); on native it's
// a deep link — exp://<host> in Expo Go, sightreading:// in real builds.
function getRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return makeRedirectUri();
}

/** Pulls tokens out of a redirect/deep-link URL and installs them as the session. */
async function createSessionFromUrl(url: string): Promise<{ ok: boolean; isRecovery: boolean }> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return { ok: false, isRecovery: false };
  const { access_token, refresh_token, type } = params;
  if (!access_token || !refresh_token) return { ok: false, isRecovery: false };
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  return { ok: !error, isRecovery: type === 'recovery' };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  // Restore the persisted session on launch and track every auth change after.
  useEffect(() => {
    // Surfaces the exact URL that must be allow-listed in the Supabase
    // dashboard (Authentication -> URL Configuration) — see docs/AUTH_SETUP.md.
    if (__DEV__) console.log('[auth] redirect URL to allow-list in Supabase:', getRedirectTo());
    if (!isSupabaseConfigured) {
      setLoaded(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Fired on web, where detectSessionInUrl consumes the recovery link itself.
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Native deep links: email-confirmation and reset-password links open the app
  // with tokens in the URL (cold start and warm start both surface through useURL).
  const url = Linking.useURL();
  const handledUrl = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' || !url || url === handledUrl.current || !isSupabaseConfigured) return;
    handledUrl.current = url;
    createSessionFromUrl(url).then(({ ok, isRecovery }) => {
      if (ok && isRecovery) setPasswordRecovery(true);
    });
  }, [url]);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: getRedirectTo() },
      });
      if (error) return { ok: false, error: mapError(error) };
      // With confirm-email ON, Supabase anti-enumeration returns a fake user with
      // no identities instead of an error when the address is already registered.
      if (data.user && (data.user.identities?.length ?? 0) === 0) return { ok: false, error: 'user-exists' };
      return { ok: true, needsConfirmation: !data.session };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? { ok: false, error: mapError(error) } : { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const redirectTo = getRedirectTo();
      if (Platform.OS === 'web') {
        // Full-page redirect: the page reloads and detectSessionInUrl signs us in.
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        return error ? { ok: false, error: mapError(error) } : { ok: true };
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) return { ok: false, error: mapError(error) };
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return { ok: false, error: 'cancelled' };
      const { ok } = await createSessionFromUrl(res.url);
      return ok ? { ok: true } : { ok: false, error: 'unknown' };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getRedirectTo() });
      return error ? { ok: false, error: mapError(error) } : { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: getRedirectTo() },
      });
      return error ? { ok: false, error: mapError(error) } : { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: mapError(error) };
      setPasswordRecovery(false);
      return { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const updateProfile = useCallback(async (patch: { name: string }): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      // onAuthStateChange (USER_UPDATED) delivers the refreshed session, which
      // re-derives `profile` — no local state to patch.
      const { error } = await supabase.auth.updateUser({ data: { name: patch.name.trim() } });
      return error ? { ok: false, error: mapError(error) } : { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
    try {
      // security-definer RPC that deletes only auth.uid() — the anon key has no
      // admin rights, so deletion must happen server-side (docs/AUTH_SETUP.md §6).
      const { error } = await supabase.rpc('delete_user');
      if (error) return { ok: false, error: mapError(error) };
      setPasswordRecovery(false);
      // Server side is gone; 'local' scope just discards the now-orphaned tokens.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      return { ok: true };
    } catch {
      return { ok: false, error: 'network' };
    }
  }, []);

  const logout = useCallback(() => {
    setPasswordRecovery(false);
    supabase.auth.signOut().catch(() => {});
  }, []);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  return (
    <Ctx.Provider
      value={{
        loaded,
        profile: profileFromSession(session),
        configured: isSupabaseConfigured,
        passwordRecovery,
        clearPasswordRecovery,
        signUp,
        signIn,
        signInWithGoogle,
        sendPasswordReset,
        resendConfirmation,
        updatePassword,
        updateProfile,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfile must be inside ProfileProvider');
  return ctx;
}
