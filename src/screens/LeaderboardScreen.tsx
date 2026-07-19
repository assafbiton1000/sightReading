import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useHistory } from '../context/HistoryContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { fetchLeaderboard, LeaderboardEntry } from '../utils/leaderboard';
import { isSupabaseConfigured } from '../utils/supabase';
import { formatPoints } from '../utils/format';
import { BADGE_META } from '../constants/badges';
import { Rank } from '../constants/ranks';
import AppHeader from '../components/AppHeader';

type Nav = StackNavigationProp<RootStackParamList>;
type Styles = ReturnType<typeof makeStyles>;

export default function LeaderboardScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLang();
  const { points } = useHistory();
  const { profile } = useProfile();
  const C = useTheme();
  const s = makeStyles(C);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchLeaderboard();
    setEntries(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.primary} />}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.leaderboardTitle}</Text>
        </View>

        <Text style={s.intro}>{t.leaderboardIntro}</Text>

        <View style={s.pointsCard}>
          <View style={[s.iconWrap, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
            <Feather name="star" size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pointsValue}>{formatPoints(points)}</Text>
            <Text style={s.pointsLabel}>{t.pointsLabel}</Text>
          </View>
        </View>

        {!isSupabaseConfigured ? (
          <View style={s.emptyBox}>
            <Feather name="clock" size={26} color={C.muted} />
            <Text style={s.emptyTxt}>{t.leaderboardNotConfigured}</Text>
          </View>
        ) : !profile ? (
          <View style={s.emptyBox}>
            <Feather name="log-in" size={26} color={C.muted} />
            <Text style={s.emptyTxt}>{t.leaderboardSignInPrompt}</Text>
            <TouchableOpacity style={s.signInBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
              <Text style={s.signInBtnTxt}>{t.leaderboardSignInBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : loading && entries.length === 0 ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 30 }} />
        ) : entries.length === 0 ? (
          <View style={s.emptyBox}>
            <Feather name="award" size={26} color={C.muted} />
            <Text style={s.emptyTxt}>{t.leaderboardEmpty}</Text>
          </View>
        ) : (
          <View style={s.list}>
            {entries.map((entry, i) => (
              <Row key={entry.userId} rank={i + 1} entry={entry} isYou={entry.userId === profile.id} s={s} C={C} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ rank: pos, entry, isYou, s, C }: { rank: number; entry: LeaderboardEntry; isYou: boolean; s: Styles; C: ThemeColors }) {
  const { t } = useLang();
  const medalColor = pos === 1 ? '#f59e0b' : pos === 2 ? '#9ca3af' : pos === 3 ? '#c2703d' : C.muted;
  const bMeta = BADGE_META[entry.badge];
  const rankNames: Record<Rank, string> = {
    beginner: t.rankBeginner,
    intermediate: t.rankIntermediate,
    advanced: t.rankAdvanced,
    expert: t.rankExpert,
    master: t.rankMaster,
  };
  return (
    <View style={[s.row, isYou && s.rowYou]}>
      <Text style={[s.rank, { color: medalColor }]}>{pos}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowName, isYou && s.rowNameYou]} numberOfLines={1}>
          {entry.displayName}{isYou ? ` (${t.leaderboardYou})` : ''}
        </Text>
        <View style={s.metaRow}>
          <Feather name={bMeta.icon} size={11} color={bMeta.color} />
          <Text style={s.rankLabel}>{rankNames[entry.rank] ?? entry.rank}</Text>
        </View>
      </View>
      <Text style={s.rowPoints}>{formatPoints(entry.points)}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    back: { fontFamily: 'Heebo_600SemiBold', fontSize: 16, color: C.primary },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },

    intro: { fontFamily: 'Heebo_400Regular', fontSize: 13.5, color: C.muted, lineHeight: 20, marginBottom: 18 },

    pointsCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, padding: 18, gap: 16, marginBottom: 18,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    pointsValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 24, color: C.text },
    pointsLabel: { fontFamily: 'Heebo_500Medium', fontSize: 12, color: C.muted, marginTop: 1 },

    list: { gap: 8 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card,
      borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
      borderWidth: 1, borderColor: C.border,
    },
    rowYou: { borderColor: C.primary, borderWidth: 1.5, backgroundColor: C.primaryTint },
    rank: { fontFamily: 'Heebo_800ExtraBold', fontSize: 15, width: 26, textAlign: 'center' },
    rowName: { fontFamily: 'Heebo_600SemiBold', fontSize: 14, color: C.text },
    rowNameYou: { fontFamily: 'Heebo_700Bold', color: C.primary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    rankLabel: { fontFamily: 'Heebo_500Medium', fontSize: 11.5, color: C.muted },
    rowPoints: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },

    emptyBox: {
      alignItems: 'center', justifyContent: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 20, padding: 32, marginTop: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2,
    },
    emptyTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
    signInBtn: { backgroundColor: C.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
    signInBtnTxt: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: '#fff' },
  });
}
