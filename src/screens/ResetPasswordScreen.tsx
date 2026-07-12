import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLang } from '../context/LangContext';
import { useProfile, AuthErrorCode } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

// Reached through the reset-password email link: the deep link has already
// signed the user in with a temporary recovery session (ProfileContext), so all
// that's left is choosing the new password.
export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { t } = useLang();
  const { updatePassword, clearPasswordRecovery } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
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

  const canSubmit = password.length > 0 && password2.length > 0;

  async function submit() {
    if (busy || !canSubmit) return;
    setError(null);
    if (password.length < 6) { setError(t.authErrWeakPassword); return; }
    if (password !== password2) { setError(t.authErrPasswordMismatch); return; }
    setBusy(true);
    try {
      const res = await updatePassword(password);
      if (res.ok) setDone(true);
      else setError(errText[res.error]);
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    clearPasswordRecovery();
    navigation.goBack();
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={leave}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.authNewPasswordTitle}</Text>
        </View>

        <View style={s.card}>
          <View style={s.iconWrap}>
            <Feather name={done ? 'check-circle' : 'key'} size={30} color={done ? '#10b981' : C.primary} />
          </View>

          {done ? (
            <>
              <Text style={s.cardTitle}>{t.authPasswordUpdatedMsg}</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={leave} activeOpacity={0.85}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={s.primaryBtnTxt}>{t.back.replace('← ', '')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.pwRow}>
                <TextInput
                  style={s.pwInput}
                  placeholder={t.authNewPasswordPlaceholder}
                  placeholderTextColor={C.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                  <Feather name={showPw ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
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
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={s.primaryBtnTxt}>{t.authSetPasswordBtn}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
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

    card: {
      alignItems: 'center', backgroundColor: C.card, borderRadius: 20, padding: 26, gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    iconWrap: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center', marginBottom: 2,
    },
    cardTitle: { fontFamily: 'Heebo_800ExtraBold', fontSize: 18, color: C.text, textAlign: 'center' },

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
  });
}
