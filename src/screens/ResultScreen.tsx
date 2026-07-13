import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { useLang } from '../context/LangContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type Route = RouteProp<RootStackParamList, 'Result'>;
type Nav = StackNavigationProp<RootStackParamList, 'Result'>;
type Styles = ReturnType<typeof makeStyles>;

export default function ResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { correct, total, levelId, clef, noteCount, bothMode, rhythmErrors, skipped, prevStreak, prevAvgAccuracy } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const { t } = useLang();
  const { stats } = useHistory(); // already reflects this session — recordSession ran before we navigated here
  const C = useTheme();
  const s = makeStyles(C);

  const pct = Math.round((correct / total) * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '💪' : '📖';
  const message = pct >= 90 ? t.msgExcellent : pct >= 70 ? t.msgGreat : pct >= 50 ? t.msgKeepGoing : t.msgNotBad;
  const streakGrew = stats.streak > prevStreak;

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <View style={s.container}>
        <Text style={s.emoji}>{emoji}</Text>
        <Text style={s.message}>{message}</Text>
        <Text style={s.score}>{correct}/{total}</Text>
        <Text style={s.pct}>{t.pctCorrect.replace('{pct}', String(pct))}</Text>

        <View style={s.bar}>
          <View style={[s.barFill, { width: `${pct}%` as any }]} />
        </View>

        {streakGrew && (
          <View style={s.streakBox}>
            <Feather name="zap" size={20} color="#f59e0b" />
            <Text style={s.streakTxt}>{t.streakGrewMsg.replace('{days}', String(stats.streak))}</Text>
          </View>
        )}

        {prevAvgAccuracy !== null && (
          <View style={s.compareBox}>
            <View style={s.compareCol}>
              <Text style={s.compareValue}>{pct}%</Text>
              <Text style={s.compareLabel}>{t.yourAccuracyLabel}</Text>
            </View>
            <Feather
              name={pct >= prevAvgAccuracy ? 'trending-up' : 'trending-down'}
              size={18}
              color={pct >= prevAvgAccuracy ? '#10b981' : C.muted}
            />
            <View style={s.compareCol}>
              <Text style={s.compareValue}>{prevAvgAccuracy}%</Text>
              <Text style={s.compareLabel}>{t.overallAvgLabel}</Text>
            </View>
          </View>
        )}

        <View style={s.infoBox}>
          <IR s={s} label={t.levelLabel}   value={`${levelId} — ${t.levelNames[level.id - 1]}`} />
          <IR s={s} label={t.notesLabel}   value={String(total)} />
          <IR s={s} label={t.correctLabel} value={String(correct)} />
          <IR s={s} label={t.wrongLabel}   value={String(total - correct - (skipped ?? 0))} />
          {typeof rhythmErrors === 'number' && rhythmErrors > 0 && (
            <IR s={s} label={t.rhythmErrorsLabel} value={String(rhythmErrors)} />
          )}
          {typeof skipped === 'number' && skipped > 0 && (
            <IR s={s} label={t.skippedLabel} value={String(skipped)} />
          )}
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

function IR({ label, value, s }: { label: string; value: string; s: Styles }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLbl}>{label}</Text>
      <Text style={s.infoVal}>{value}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 72 },
    message: { fontFamily: 'Heebo_800ExtraBold', fontSize: 28, color: C.text, marginTop: 8, textAlign: 'center' },
    score: { fontFamily: 'Heebo_800ExtraBold', fontSize: 56, color: C.primary, marginTop: 12 },
    pct: { fontFamily: 'Heebo_500Medium', fontSize: 18, color: C.muted, marginBottom: 12 },
    bar: { width: '100%', height: 12, backgroundColor: C.border, borderRadius: 6, overflow: 'hidden', marginBottom: 20 },
    barFill: { height: 12, backgroundColor: C.primary, borderRadius: 6 },

    streakBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%',
      backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, padding: 14, marginBottom: 14,
    },
    streakTxt: { flex: 1, fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },

    compareBox: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%',
      backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20,
    },
    compareCol: { alignItems: 'center' },
    compareValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },
    compareLabel: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted, marginTop: 2 },

    infoBox: { width: '100%', backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 24 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    infoLbl: { fontFamily: 'Heebo_400Regular', color: C.muted, fontSize: 13 },
    infoVal: { fontFamily: 'Heebo_600SemiBold', color: C.text, fontSize: 13 },
    btn: { width: '100%', backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    btnTxt: { fontFamily: 'Heebo_800ExtraBold', color: '#fff', fontSize: 16 },
    btnSec: { width: '100%', backgroundColor: C.card, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    btnSecTxt: { fontFamily: 'Heebo_600SemiBold', color: C.text, fontSize: 16 },
  });
}
