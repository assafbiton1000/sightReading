import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useProfile, AuthErrorCode } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type Styles = ReturnType<typeof makeStyles>;
type Mode = 'signin' | 'signup' | 'forgot';
// After a successful "send email" action the form is replaced by a
// check-your-inbox notice; `email` is kept for the message and for resending.
type SentNotice = { kind: 'verify' | 'reset'; email: string } | null;

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export default function AuthScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const { t } = useLang();
  const { configured, signIn, signUp, signInWithGoogle, sendPasswordReset, resendConfirmation } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'signin');
  const [sent, setSent] = useState<SentNotice>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errText: Record<AuthErrorCode, string> = {
    'invalid-credentials': t.authErrInvalidCreds,
    'email-not-confirmed': t.authErrEmailNotConfirmed,
    'user-exists': t.authErrUserExists,
    'weak-password': t.authErrWeakPassword,
    network: t.authErrNetwork,
    cancelled: t.authErrCancelled,
    'not-configured': t.authErrNotConfigured,
    unknown: t.authErrUnknown,
  };

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSent(null);
    setResent(false);
  }

  const canSubmit =
    mode === 'forgot'
      ? isValidEmail(email)
      : mode === 'signin'
        ? isValidEmail(email) && password.length > 0
        : name.trim().length > 0 && isValidEmail(email) && password.length > 0;

  async function submit() {
    if (busy || !canSubmit) return;
    setError(null);

    if (mode === 'signup') {
      if (password.length < 6) { setError(t.authErrWeakPassword); return; }
      if (password !== password2) { setError(t.authErrPasswordMismatch); return; }
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.ok) navigation.goBack();
        else setError(errText[res.error]);
      } else if (mode === 'signup') {
        const res = await signUp(name, email, password);
        if (!res.ok) setError(errText[res.error]);
        else if (res.needsConfirmation) setSent({ kind: 'verify', email: email.trim() });
        else navigation.goBack();
      } else {
        const res = await sendPasswordReset(email);
        if (res.ok) setSent({ kind: 'reset', email: email.trim() });
        else setError(errText[res.error]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (googleBusy) return;
    setError(null);
    setGoogleBusy(true);
    try {
      const res = await signInWithGoogle();
      if (res.ok) navigation.goBack();
      else if (res.error !== 'cancelled') setError(errText[res.error]);
    } finally {
      setGoogleBusy(false);
    }
  }

  async function resend() {
    if (!sent || resent) return;
    const res = await resendConfirmation(sent.email);
    if (res.ok) setResent(true);
    else setError(errText[res.error]);
  }

  const title = mode === 'signin' ? t.authSignInTitle : mode === 'signup' ? t.authSignUpTitle : t.authForgotTitle;

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{title}</Text>
        </View>

        {!configured && (
          <View style={s.warnBanner}>
            <Feather name="alert-triangle" size={16} color="#b45309" />
            <Text style={s.warnTxt}>{t.authErrNotConfigured}</Text>
          </View>
        )}

        {sent ? (
          /* ---- "Check your inbox" notice (after sign-up or reset request) ---- */
          <View style={s.card}>
            <View style={s.iconWrap}>
              <Feather name="mail" size={30} color={C.primary} />
            </View>
            <Text style={s.cardTitle}>{sent.kind === 'verify' ? t.authVerifySentTitle : t.authResetSentTitle}</Text>
            <Text style={s.cardHint}>
              {(sent.kind === 'verify' ? t.authVerifySentMsg : t.authResetSentMsg).replace('{email}', sent.email)}
            </Text>
            {sent.kind === 'verify' && (
              <TouchableOpacity style={s.linkBtn} onPress={resend} disabled={resent} activeOpacity={0.8}>
                <Text style={[s.linkTxt, resent && { color: C.muted }]}>
                  {resent ? t.authResendDone : t.authResendBtn}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.primaryBtn} onPress={() => switchMode('signin')} activeOpacity={0.85}>
              <Feather name="log-in" size={16} color="#fff" />
              <Text style={s.primaryBtnTxt}>{t.authBackToSignIn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ---- Sign-in / sign-up / forgot form ---- */
          <View style={s.card}>
            <View style={s.iconWrap}>
              <Feather name={mode === 'forgot' ? 'key' : 'user'} size={30} color={C.primary} />
            </View>

            {mode === 'forgot' && <Text style={s.cardHint}>{t.authForgotHint}</Text>}

            {mode === 'signup' && (
              <TextInput
                style={s.input}
                placeholder={t.profileNamePlaceholder}
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
              />
            )}
            <TextInput
              style={s.input}
              placeholder={t.profileEmailPlaceholder}
              placeholderTextColor={C.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {mode !== 'forgot' && (
              <View style={s.pwRow}>
                <TextInput
                  style={s.pwInput}
                  placeholder={t.authPasswordPlaceholder}
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            )}
            {mode === 'signup' && (
              <View style={s.pwRow}>
                <TextInput
                  style={s.pwInput}
                  placeholder={t.authPasswordConfirmPlaceholder}
                  placeholderTextColor={C.muted}
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            )}

            {!!error && <Text style={s.errorTxt}>{error}</Text>}

            <TouchableOpacity
              style={[s.primaryBtn, (!canSubmit || busy) && s.btnDisabled]}
              onPress={submit}
              disabled={!canSubmit || busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name={mode === 'forgot' ? 'send' : 'log-in'} size={16} color="#fff" />
                  <Text style={s.primaryBtnTxt}>
                    {mode === 'signin' ? t.profileLoginBtn : mode === 'signup' ? t.authSignUpBtn : t.authSendResetBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {mode !== 'forgot' && (
              <>
                <View style={s.dividerRow}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerTxt}>{t.authOrDivider}</Text>
                  <View style={s.dividerLine} />
                </View>
                <TouchableOpacity style={[s.googleBtn, googleBusy && s.btnDisabled]} onPress={google} disabled={googleBusy} activeOpacity={0.85}>
                  {googleBusy ? (
                    <ActivityIndicator size="small" color={C.text} />
                  ) : (
                    <>
                      <AntDesign name="google" size={16} color="#EA4335" />
                      <Text style={s.googleBtnTxt}>{t.authGoogleBtn}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {mode === 'signin' && (
              <TouchableOpacity style={s.linkBtn} onPress={() => switchMode('forgot')} activeOpacity={0.8}>
                <Text style={s.linkTxt}>{t.authForgotLink}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.linkBtn}
              onPress={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
              activeOpacity={0.8}
            >
              <Text style={s.linkTxt}>{mode === 'signup' ? t.authSwitchToSignIn : t.authSwitchToSignUp}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    warnBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(245,158,11,0.14)', borderRadius: 14, padding: 12, marginBottom: 12,
    },
    warnTxt: { flex: 1, fontFamily: 'Heebo_500Medium', fontSize: 12.5, color: '#b45309', lineHeight: 18 },

    card: {
      alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 26, gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    iconWrap: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center', marginBottom: 2,
    },
    cardTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 18, color: C.text },
    cardHint: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19, marginBottom: 6 },

    input: {
      alignSelf: 'stretch', backgroundColor: C.chipBg, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
      fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text,
    },
    pwRow: {
      alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.chipBg, borderRadius: 12, marginBottom: 8,
    },
    pwInput: {
      flex: 1, paddingHorizontal: 14, paddingVertical: 10,
      fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.text,
    },
    eyeBtn: { paddingHorizontal: 12, paddingVertical: 10 },
    errorTxt: {
      alignSelf: 'stretch', fontFamily: 'Heebo_600SemiBold', fontSize: 12.5, color: '#ef4444',
      textAlign: 'center', lineHeight: 18,
    },

    primaryBtn: {
      alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: C.primary, borderRadius: 14, paddingVertical: 12, marginTop: 4,
    },
    primaryBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: '#fff' },
    btnDisabled: { opacity: 0.4 },

    dividerRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerTxt: { fontFamily: 'Heebo_500Medium', fontSize: 12, color: C.muted },

    googleBtn: {
      alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: C.chipBg, borderRadius: 14, paddingVertical: 12,
      borderWidth: 1, borderColor: C.border,
    },
    googleBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },

    linkBtn: { paddingVertical: 6 },
    linkTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.primary },
  });
}
