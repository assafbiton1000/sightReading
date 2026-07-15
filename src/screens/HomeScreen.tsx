import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LEVELS, NOTE_COUNT_OPTIONS, Clef } from '../constants/levels';
import { BothMode } from '../utils/noteGenerator';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, ThemeColors } from '../utils/theme';
import { formatMinutes, formatPoints } from '../utils/format';
import AppHeader from '../components/AppHeader';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;
type Mode = 'sightreading' | 'playback' | 'search';
type FeatherIcon = keyof typeof Feather.glyphMap;
type Styles = ReturnType<typeof makeStyles>;

const CLEF_OPTIONS: { value: Clef; key: 'clefTreble' | 'clefBass' | 'clefBoth' }[] = [
  { value: 'treble', key: 'clefTreble' },
  { value: 'bass',   key: 'clefBass'   },
  { value: 'both',   key: 'clefBoth'   },
];

const MODE_COLORS: Record<Mode, { base: string; tint: string }> = {
  sightreading: { base: '#4F6EF7', tint: 'rgba(79,110,247,0.08)' },
  playback:     { base: '#10b981', tint: 'rgba(16,185,129,0.08)' },
  search:       { base: '#f59e0b', tint: 'rgba(245,158,11,0.08)' },
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLang();
  const { stats, points } = useHistory();
  const C = useTheme();
  const s = makeStyles(C);

  const [selectedMode, setSelectedMode] = useState<Mode | null>('sightreading');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedClef, setSelectedClef] = useState<Clef>('treble');
  const [selectedNoteCount, setSelectedNoteCount] = useState(8);
  const [bothMode, setBothMode] = useState<BothMode>('sequential');

  const level = LEVELS.find(l => l.id === selectedLevel)!;
  const showOptions = selectedMode !== null && selectedMode !== 'search';

  function toggleMode(id: Mode) {
    setSelectedMode(prev => (prev === id ? null : id));
  }

  const MODES: { id: Mode; title: string; desc: string; icon: FeatherIcon }[] = [
    { id: 'sightreading', title: t.modeSRTitle,     desc: t.modeSRDesc,     icon: 'target' },
    { id: 'playback',     title: t.modeListenTitle, desc: t.modeListenDesc, icon: 'headphones' },
    { id: 'search',       title: t.modeSearchTitle, desc: t.modeSearchDesc, icon: 'music' },
  ];

  const BOTH_MODES = [
    { value: 'sequential'   as BothMode, label: t.seqLabel, desc: t.seqDesc },
    { value: 'simultaneous' as BothMode, label: t.simLabel, desc: t.simDesc },
  ];

  function handleStart() {
    if (!selectedMode) return;
    if (selectedMode === 'search') { navigation.navigate('SongLibrary'); return; }
    const params = { levelId: selectedLevel, clef: selectedClef, noteCount: selectedNoteCount, bothMode };
    navigation.navigate(selectedMode === 'sightreading' ? 'Practice' : 'Playback', params);
  }

  return (
    <SafeAreaView style={s.safe}>
      <AppHeader />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t.appTitle}</Text>
        <Text style={s.subtitle}>{t.appSubtitle}</Text>

        <View style={s.statsRow}>
          <View style={s.statPill}>
            <View style={[s.statPillIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
              <Feather name="zap" size={16} color="#f59e0b" />
            </View>
            <View>
              <Text style={s.statPillValue}>{stats.streak}</Text>
              <Text style={s.statPillLabel}>{t.dayStreakLabel}</Text>
            </View>
          </View>
          <View style={s.statPill}>
            <View style={[s.statPillIcon, { backgroundColor: C.primaryTint }]}>
              <Feather name="clock" size={16} color={C.primary} />
            </View>
            <View>
              <Text style={s.statPillValue}>{formatMinutes(stats.weekMinutes)} <Text style={s.statPillUnit}>{t.minutesUnit}</Text></Text>
              <Text style={s.statPillLabel}>{t.thisWeekLabel}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.pointsBar} onPress={() => navigation.navigate('Leaderboard')} activeOpacity={0.85}>
          <View style={[s.statPillIcon, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
            <Feather name="star" size={16} color="#f59e0b" />
          </View>
          <Text style={s.pointsBarTxt}>
            <Text style={s.pointsBarValue}>{formatPoints(points)}</Text> {t.pointsLabel}
          </Text>
          <Feather name="chevron-right" size={16} color={C.muted} />
        </TouchableOpacity>

        <Label s={s}>{t.chooseMode}</Label>
        <View style={s.modesCol}>
          {MODES.map(m => {
            const active = selectedMode === m.id;
            const colors = MODE_COLORS[m.id];
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.modeCard, active && { borderColor: colors.base }]}
                onPress={() => toggleMode(m.id)}
                activeOpacity={0.85}
              >
                <View style={[s.iconWrap, { backgroundColor: active ? colors.base : colors.tint }]}>
                  <Feather name={m.icon} size={20} color={active ? '#fff' : colors.base} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modeTitle, active && { color: colors.base }]}>{m.title}</Text>
                  <Text style={s.modeDesc}>{m.desc}</Text>
                </View>
                {active && (
                  <View style={[s.check, { backgroundColor: colors.base }]}>
                    <Feather name="check" size={13} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showOptions && (
          <>
            <Label s={s}>{t.chooseLevel}</Label>
            <View style={s.grid}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[s.chip, selectedLevel === l.id && s.chipActive]}
                  onPress={() => setSelectedLevel(l.id)}
                >
                  <Text style={[s.chipNum, selectedLevel === l.id && s.chipTxtActive]}>{l.id}</Text>
                  <Text style={[s.chipLbl, selectedLevel === l.id && s.chipTxtActive]}>{t.levelNames[l.id - 1]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.statsCard}>
              <Stat s={s} C={C} icon="clock" value={`${level.bpm}`} label="BPM" />
              <View style={s.statDivider} />
              <Stat s={s} C={C} icon="layers" value={level.allowChords ? t.yes : t.no} label={t.chords} />
              <View style={s.statDivider} />
              <Stat s={s} C={C} icon="key" value={`${t.upTo} ${level.maxSharpsFlats}`} label={t.sharpsFlats} />
            </View>

            <Label s={s}>{t.chooseClef}</Label>
            <View style={s.row}>
              {CLEF_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.pill, selectedClef === opt.value && s.pillActive]}
                  onPress={() => setSelectedClef(opt.value)}
                >
                  <Text style={[s.pillTxt, selectedClef === opt.value && s.pillTxtActive]}>{t[opt.key]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedClef === 'both' && (
              <>
                <Label s={s}>{t.playOrder}</Label>
                <View style={s.modesCol}>
                  {BOTH_MODES.map(opt => {
                    const active = bothMode === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[s.modeCard, active && { borderColor: C.primary }]}
                        onPress={() => setBothMode(opt.value)}
                        activeOpacity={0.85}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.modeTitle, active && { color: C.primary }]}>{opt.label}</Text>
                          <Text style={s.modeDesc}>{opt.desc}</Text>
                        </View>
                        {active && (
                          <View style={[s.check, { backgroundColor: C.primary }]}>
                            <Feather name="check" size={13} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Label s={s}>{t.noteCount}</Label>
            <View style={s.row}>
              {NOTE_COUNT_OPTIONS.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.pill, selectedNoteCount === n && s.pillActive]}
                  onPress={() => setSelectedNoteCount(n)}
                >
                  <Text style={[s.pillTxt, selectedNoteCount === n && s.pillTxtActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[s.startBtn, !selectedMode && s.startBtnDisabled]}
          onPress={handleStart}
          activeOpacity={0.88}
          disabled={!selectedMode}
        >
          <Text style={[s.startBtnTxt, !selectedMode && s.startBtnTxtDisabled]}>
            {!selectedMode ? t.chooseMode : selectedMode === 'search' ? t.openSearch : t.startBtn}
          </Text>
        </TouchableOpacity>

        <View style={s.bottomBtns}>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Learning')} activeOpacity={0.85}>
            <Feather name="book-open" size={18} color={C.muted} />
            <Text style={s.secondaryTxt}>{t.learningBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('AudioTest')} activeOpacity={0.85}>
            <Feather name="activity" size={18} color={C.muted} />
            <Text style={s.secondaryTxt}>{t.audioTestBtn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children, s }: { children: string; s: Styles }) {
  return <Text style={s.label}>{children}</Text>;
}
function Stat({ icon, value, label, s, C }: { icon: FeatherIcon; value: string; label: string; s: Styles; C: ThemeColors }) {
  return (
    <View style={s.stat}>
      <View style={s.statIconWrap}>
        <Feather name={icon} size={16} color={C.primary} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 3,
};

const softShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
};

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 24, paddingBottom: 48 },
    title: { fontFamily: 'Heebo_800ExtraBold', fontSize: 32, color: C.text, textAlign: 'center' },
    subtitle: { fontFamily: 'Heebo_500Medium', fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 4, marginBottom: 20 },

    statsRow: { flexDirection: 'row', gap: 10 },
    statPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: C.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, ...softShadow,
    },
    statPillIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    statPillValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 17, color: C.text },
    statPillUnit: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted },
    statPillLabel: { fontFamily: 'Heebo_500Medium', fontSize: 10.5, color: C.muted, marginTop: 1 },

    pointsBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10,
      backgroundColor: C.card, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, ...softShadow,
    },
    pointsBarTxt: { flex: 1, fontFamily: 'Heebo_500Medium', fontSize: 13, color: C.text },
    pointsBarValue: { fontFamily: 'Heebo_800ExtraBold', fontSize: 15, color: C.text },

    label: { fontFamily: 'Heebo_700Bold', fontSize: 13, color: C.muted, letterSpacing: 0.2, marginTop: 28, marginBottom: 12 },

    modesCol: { gap: 12 },
    modeCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, padding: 18, gap: 14, borderWidth: 2, borderColor: 'transparent', ...cardShadow,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    modeTitle: { fontFamily: 'Heebo_700Bold', fontSize: 15, color: C.text },
    modeDesc: { fontFamily: 'Heebo_400Regular', fontSize: 12.5, color: C.muted, marginTop: 3 },
    check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      width: '22.5%', aspectRatio: 1, borderRadius: 16, backgroundColor: C.card,
      borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    },
    chipActive: { backgroundColor: C.primary, borderColor: C.primary },
    chipNum: { fontFamily: 'Heebo_800ExtraBold', fontSize: 18, color: C.text },
    chipLbl: { fontFamily: 'Heebo_500Medium', fontSize: 9, color: C.muted, textAlign: 'center', marginTop: 2, paddingHorizontal: 2 },
    chipTxtActive: { color: '#fff' },

    statsCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 20, paddingVertical: 18, paddingHorizontal: 10, marginTop: 14, ...cardShadow,
    },
    stat: { flex: 1, alignItems: 'center', gap: 6 },
    statIconWrap: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    statValue: { fontFamily: 'Heebo_700Bold', fontSize: 14, color: C.text },
    statLabel: { fontFamily: 'Heebo_500Medium', fontSize: 11, color: C.muted },
    statDivider: { width: 1, height: '60%', backgroundColor: C.border },

    row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    pill: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: C.chipBg },
    pillActive: { backgroundColor: C.primary },
    pillTxt: { fontFamily: 'Heebo_600SemiBold', fontSize: 13, color: C.text },
    pillTxtActive: { color: '#fff' },

    startBtn: {
      marginTop: 36, backgroundColor: C.primary, borderRadius: 20, paddingVertical: 19, alignItems: 'center',
      shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    startBtnDisabled: {
      backgroundColor: C.chipBg, shadowOpacity: 0, elevation: 0,
    },
    startBtnTxt: { fontFamily: 'Heebo_700Bold', color: '#fff', fontSize: 17 },
    startBtnTxtDisabled: { color: C.muted },

    bottomBtns: { marginTop: 14, flexDirection: 'row', gap: 12 },
    secondaryBtn: {
      flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
      borderRadius: 18, backgroundColor: C.card, gap: 6, ...softShadow,
    },
    secondaryTxt: { fontFamily: 'Heebo_600SemiBold', color: C.muted, fontSize: 12.5 },
  });
}
