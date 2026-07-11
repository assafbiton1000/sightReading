import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LEVELS, NOTE_COUNT_OPTIONS, Clef } from '../constants/levels';
import { BothMode } from '../utils/noteGenerator';
import { RootStackParamList } from '../navigation/types';
import { useLang } from '../context/LangContext';
import { LANGUAGE_META, Lang } from '../utils/i18n';

type Nav = StackNavigationProp<RootStackParamList, 'Home'>;
type Mode = 'sightreading' | 'playback' | 'search';

const CLEF_OPTIONS: { value: Clef; key: 'clefTreble' | 'clefBass' | 'clefBoth' }[] = [
  { value: 'treble', key: 'clefTreble' },
  { value: 'bass',   key: 'clefBass'   },
  { value: 'both',   key: 'clefBoth'   },
];

const LANGS = Object.entries(LANGUAGE_META) as [Lang, { name: string; rtl: boolean }][];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t, lang, setLang } = useLang();

  const [selectedMode, setSelectedMode] = useState<Mode>('sightreading');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedClef, setSelectedClef] = useState<Clef>('treble');
  const [selectedNoteCount, setSelectedNoteCount] = useState(8);
  const [bothMode, setBothMode] = useState<BothMode>('sequential');

  const level = LEVELS.find(l => l.id === selectedLevel)!;
  const showOptions = selectedMode !== 'search';

  const MODES: { id: Mode; title: string; desc: string; icon: string; color: string }[] = [
    { id: 'sightreading', title: t.modeSRTitle,     desc: t.modeSRDesc,     icon: '🎯', color: '#4F6EF7' },
    { id: 'playback',     title: t.modeListenTitle, desc: t.modeListenDesc, icon: '🎵', color: '#10b981' },
    { id: 'search',       title: t.modeSearchTitle, desc: t.modeSearchDesc, icon: '🔍', color: '#f59e0b' },
  ];

  const BOTH_MODES = [
    { value: 'sequential'   as BothMode, label: t.seqLabel, desc: t.seqDesc },
    { value: 'simultaneous' as BothMode, label: t.simLabel, desc: t.simDesc },
  ];

  function handleStart() {
    if (selectedMode === 'search') { navigation.navigate('Search'); return; }
    const params = { levelId: selectedLevel, clef: selectedClef, noteCount: selectedNoteCount, bothMode };
    navigation.navigate(selectedMode === 'sightreading' ? 'Practice' : 'Playback', params);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t.appTitle}</Text>
        <Text style={s.subtitle}>{t.appSubtitle}</Text>

        {/* Language selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.langScroll} contentContainerStyle={s.langRow}>
          {LANGS.map(([code, meta]) => (
            <TouchableOpacity
              key={code}
              style={[s.langBtn, lang === code && s.langBtnActive]}
              onPress={() => setLang(code)}
            >
              <Text style={[s.langTxt, lang === code && s.langTxtActive]}>{meta.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Label>{t.chooseMode}</Label>
        <View style={s.modesCol}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.modeCard, selectedMode === m.id && { borderColor: m.color, borderWidth: 2.5 }]}
              onPress={() => setSelectedMode(m.id)}
            >
              <Text style={s.modeIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.modeTitle, selectedMode === m.id && { color: m.color }]}>{m.title}</Text>
                <Text style={s.modeDesc}>{m.desc}</Text>
              </View>
              {selectedMode === m.id && (
                <View style={[s.check, { backgroundColor: m.color }]}>
                  <Text style={s.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {showOptions && (
          <>
            <Label>{t.chooseLevel}</Label>
            <View style={s.grid}>
              {LEVELS.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[s.chip, selectedLevel === l.id && s.chipActive]}
                  onPress={() => setSelectedLevel(l.id)}
                >
                  <Text style={[s.chipNum, selectedLevel === l.id && s.chipTxtActive]}>{l.id}</Text>
                  <Text style={[s.chipLbl, selectedLevel === l.id && s.chipTxtActive]}>{l.nameHe}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.infoBox}>
              <IR label={t.tempo}  value={`${level.bpm} BPM`} />
              <IR label={t.chords} value={level.allowChords ? t.yes : t.no} />
              <IR label={t.maxKeys} value={`${t.upTo} ${level.maxSharpsFlats} ${t.sharpsFlats}`} />
            </View>

            <Label>{t.chooseClef}</Label>
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
                <Label>{t.playOrder}</Label>
                <View style={s.modesCol}>
                  {BOTH_MODES.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.modeCard, bothMode === opt.value && { borderColor: C.primary, borderWidth: 2 }]}
                      onPress={() => setBothMode(opt.value)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.modeTitle, bothMode === opt.value && { color: C.primary }]}>{opt.label}</Text>
                        <Text style={s.modeDesc}>{opt.desc}</Text>
                      </View>
                      {bothMode === opt.value && (
                        <View style={[s.check, { backgroundColor: C.primary }]}>
                          <Text style={s.checkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Label>{t.noteCount}</Label>
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

        <TouchableOpacity style={s.startBtn} onPress={handleStart}>
          <Text style={s.startBtnTxt}>{selectedMode === 'search' ? t.openSearch : t.startBtn}</Text>
        </TouchableOpacity>

        <View style={s.bottomBtns}>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Learning')}>
            <Text style={s.secondaryTxt}>{t.learningBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('AudioTest')}>
            <Text style={s.secondaryTxt}>{t.audioTestBtn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
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
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 12 },

  langScroll: { marginBottom: 16 },
  langRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  langBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  langTxt: { fontSize: 12, fontWeight: '600', color: C.muted },
  langTxtActive: { color: '#fff' },

  label: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  modesCol: { gap: 8 },
  modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: C.border, gap: 12 },
  modeIcon: { fontSize: 26 },
  modeTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  modeDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { width: '22%', aspectRatio: 1, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipNum: { fontSize: 18, fontWeight: '800', color: C.text },
  chipLbl: { fontSize: 9, color: C.muted, textAlign: 'center' },
  chipTxtActive: { color: '#fff' },
  infoBox: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoLbl: { color: C.muted, fontSize: 13 },
  infoVal: { color: C.text, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  pillActive: { backgroundColor: C.primary, borderColor: C.primary },
  pillTxt: { fontSize: 13, color: C.text, fontWeight: '600' },
  pillTxtActive: { color: '#fff' },
  startBtn: { marginTop: 32, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  startBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  bottomBtns: { marginTop: 12, flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  secondaryTxt: { color: C.muted, fontSize: 13, fontWeight: '600' },
});
