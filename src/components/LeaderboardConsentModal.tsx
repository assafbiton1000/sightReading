import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useLang } from '../context/LangContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { PRIVACY_POLICY_URL } from '../constants/about';
import type { LbChoice } from '../utils/leaderboardChoice';

// Disclosure + choice shown before anything is published to the public
// leaderboard. Neither option is preselected; "decide later" publishes nothing.
// Bump LB_DISCLOSURE_VERSION (utils/leaderboardChoice.ts) if this text's meaning changes.
export default function LeaderboardConsentModal({ visible, current, onChoose, onLater }: {
  visible: boolean;
  current: LbChoice | null | undefined;
  onChoose: (choice: LbChoice) => void;
  onLater: () => void;
}) {
  const { t } = useLang();
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={s.wrap}>
        <View style={s.card}>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <Text style={s.title} accessibilityRole="header">{t.lbConsentTitle}</Text>
            <Text style={s.body}>{t.lbConsentBody}</Text>
            <Text style={s.note}>{t.lbConsentNote}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})} accessibilityRole="link">
              <Text style={s.link}>{t.privacyPolicyLink}</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={s.btns}>
            {(['in', 'out'] as const).map(choice => (
              <TouchableOpacity
                key={choice}
                style={[s.btn, current === choice && s.btnCurrent]}
                onPress={() => onChoose(choice)}
                accessibilityRole="button"
                accessibilityState={{ selected: current === choice }}
                activeOpacity={0.8}
              >
                <Text style={s.btnTxt}>{choice === 'in' ? t.lbConsentJoin : t.lbConsentDecline}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onLater} accessibilityRole="button" style={s.later}>
            <Text style={s.laterTxt}>{t.lbConsentLater}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: 'rgba(10,10,20,0.45)', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 12, maxHeight: '90%' },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 17, color: C.text },
    body: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.text, lineHeight: 21 },
    note: { fontFamily: 'Heebo_400Regular', fontSize: 13, color: C.muted, lineHeight: 19 },
    link: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.primary, paddingVertical: 4 },
    btns: { flexDirection: 'row', gap: 10 },
    btn: {
      flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
      borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
    },
    btnCurrent: { borderColor: C.primary },
    btnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text, textAlign: 'center' },
    later: { alignSelf: 'center', paddingVertical: 4 },
    laterTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.muted },
  });
}
