import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLang } from '../context/LangContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { formatMinutes } from '../utils/format';
import AppHeader from '../components/AppHeader';

type FeatherIcon = keyof typeof Feather.glyphMap;
type Styles = ReturnType<typeof makeStyles>;

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const { t } = useLang();
  const { stats } = useHistory();
  const C = useTheme();
  const s = makeStyles(C);

  const hasStats = stats.totalSessions > 0;

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.statisticsTitle}</Text>
        </View>

        {!hasStats ? (
          <View style={s.emptyBox}>
            <Feather name="bar-chart-2" size={28} color={C.muted} />
            <Text style={s.emptyTxt}>{t.noStatsYet}</Text>
          </View>
        ) : (
          <>
            <StatCard s={s} C={C} icon="zap" iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)">
              <Text style={s.bigValue}>{stats.streak} <Text style={s.bigUnit}>{t.daysUnit}</Text></Text>
              <Text style={s.bigLabel}>{t.dayStreakLabel}</Text>
            </StatCard>

            <StatCard s={s} C={C} icon="clock" iconColor={C.primary} iconBg={C.primaryTint}>
              <Text style={s.cardTitle}>{t.practiceTimeLabel}</Text>
              <View style={s.splitRow}>
                <View style={s.splitCol}>
                  <Text style={s.splitValue}>{formatMinutes(stats.todayMinutes)} <Text style={s.splitUnit}>{t.minutesUnit}</Text></Text>
                  <Text style={s.splitLabel}>{t.todayLabel}</Text>
                </View>
                <View style={s.splitDivider} />
                <View style={s.splitCol}>
                  <Text style={s.splitValue}>{formatMinutes(stats.weekMinutes)} <Text style={s.splitUnit}>{t.minutesUnit}</Text></Text>
                  <Text style={s.splitLabel}>{t.thisWeekLabel}</Text>
                </View>
              </View>
            </StatCard>

            <StatCard s={s} C={C} icon="target" iconColor="#10b981" iconBg="rgba(16,185,129,0.12)">
              <Text style={s.bigValue}>{stats.avgAccuracy !== null ? `${stats.avgAccuracy}%` : '—'}</Text>
              <Text style={s.bigLabel}>{t.avgAccuracyLabel}</Text>
            </StatCard>

            <View style={s.footerRow}>
              <Text style={s.footerTxt}>{t.totalSessionsLabel}</Text>
              <Text style={s.footerVal}>{stats.totalSessions}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon, iconColor, iconBg, children, s, C,
}: {
  icon: FeatherIcon; iconColor: string; iconBg: string; children: React.ReactNode; s: Styles; C: ThemeColors;
}) {
  return (
    <View style={s.card}>
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
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

    card: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, padding: 18, gap: 16, marginBottom: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 3,
    },
    iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

    bigValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 30, color: C.text },
    bigUnit: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted },
    bigLabel: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted, marginTop: 2 },

    cardTitle: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text, marginBottom: 10 },
    splitRow: { flexDirection: 'row', alignItems: 'center' },
    splitCol: { flex: 1, alignItems: 'flex-start' },
    splitValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 20, color: C.text },
    splitUnit: { fontFamily: 'Heebo_500Medium', fontSize: 12, color: C.muted },
    splitLabel: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted, marginTop: 2 },
    splitDivider: { width: 1, height: 34, backgroundColor: C.border, marginHorizontal: 12 },

    footerRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 6, marginTop: 4,
    },
    footerTxt: { fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.muted },
    footerVal: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.text },

    emptyBox: {
      alignItems: 'center', justifyContent: 'center', gap: 12,
      backgroundColor: C.card, borderRadius: 20, padding: 36, marginTop: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2,
    },
    emptyTxt: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted, textAlign: 'center' },
  });
}
