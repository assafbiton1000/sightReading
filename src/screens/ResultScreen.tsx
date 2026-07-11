import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { useLang } from '../context/LangContext';

type Route = RouteProp<RootStackParamList, 'Result'>;
type Nav = StackNavigationProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { correct, total, levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const { t } = useLang();

  const pct = Math.round((correct / total) * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '💪' : '📖';
  const message = pct >= 90 ? t.msgExcellent : pct >= 70 ? t.msgGreat : pct >= 50 ? t.msgKeepGoing : t.msgNotBad;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.emoji}>{emoji}</Text>
        <Text style={s.message}>{message}</Text>
        <Text style={s.score}>{correct}/{total}</Text>
        <Text style={s.pct}>{t.pctCorrect.replace('{pct}', String(pct))}</Text>

        <View style={s.bar}>
          <View style={[s.barFill, { width: `${pct}%` as any }]} />
        </View>

        <View style={s.infoBox}>
          <IR label={t.levelLabel}   value={`${levelId} — ${level.nameHe}`} />
          <IR label={t.notesLabel}   value={String(total)} />
          <IR label={t.correctLabel} value={String(correct)} />
          <IR label={t.wrongLabel}   value={String(total - correct)} />
        </View>

        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Practice', { levelId, clef, noteCount, bothMode })}>
          <Text style={s.btnTxt}>{t.tryAgainSame}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSec} onPress={() => navigation.navigate('Home')}>
          <Text style={s.btnSecTxt}>{t.backToMenu}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function IR({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLbl}>{label}</Text>
      <Text style={s.infoVal}>{value}</Text>
    </View>
  );
}

const C = { bg: '#F5F7FA', card: '#fff', primary: '#4F6EF7', text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0' };
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 72 },
  message: { fontSize: 28, fontWeight: '800', color: C.text, marginTop: 8, textAlign: 'center' },
  score: { fontSize: 56, fontWeight: '900', color: C.primary, marginTop: 12 },
  pct: { fontSize: 18, color: C.muted, marginBottom: 12 },
  bar: { width: '100%', height: 12, backgroundColor: C.border, borderRadius: 6, overflow: 'hidden', marginBottom: 24 },
  barFill: { height: 12, backgroundColor: C.primary, borderRadius: 6 },
  infoBox: { width: '100%', backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLbl: { color: C.muted, fontSize: 13 },
  infoVal: { color: C.text, fontSize: 13, fontWeight: '600' },
  btn: { width: '100%', backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnSec: { width: '100%', backgroundColor: C.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  btnSecTxt: { color: C.text, fontSize: 16, fontWeight: '600' },
});
