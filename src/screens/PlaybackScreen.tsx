import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { generateExercise, getRandomKeySignature, GeneratedNote } from '../utils/noteGenerator';
import { noteToFreq } from '../utils/musicTheory';
import { DURATION_BEATS } from '../constants/notes';
import SheetMusic from '../components/SheetMusic';
import PlaybackCursor, { usePlaybackCursor } from '../components/PlaybackCursor';
import { timbreSettings } from '../utils/timbreSettings';
import { buildSynthHtml } from '../utils/pianoSynthHtml';
import { useLang } from '../context/LangContext';
import { useSettings } from '../context/SettingsContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, useIsDark, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type Route = RouteProp<RootStackParamList, 'Playback'>;
type Nav = StackNavigationProp<RootStackParamList, 'Playback'>;

export default function PlaybackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';
  const { t } = useLang();
  const { settings } = useSettings();
  const { recordSession } = useHistory();
  const theme = useTheme();
  const isDark = useIsDark();
  const C = { ...theme, primary: '#10b981' }; // Playback keeps its own green accent
  const styles = makeStyles(C);

  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [keySignature, setKeySignature] = useState('C');
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const synthHtml = useRef((() => { const t = timbreSettings.get(); return buildSynthHtml(t.brightness, t.sustain); })()).current;

  // Playback cursor
  const [cursor, cursorXAnim, cursorLineIdx] = usePlaybackCursor();

  function generate() {
    const generated = generateExercise(level, clef, noteCount, bothMode);
    const keySig = getRandomKeySignature(level.maxSharpsFlats);
    setNotes(generated);
    setKeySignature(keySig);
    setHighlightedIndices([]);
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cursor.reset();
    cursor.setPositions([]);
  }

  useEffect(() => { generate(); }, []);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  function sendNote(freq: number, dur: number) {
    // Read live (not the snapshot the WebView HTML was built with) so a Settings
    // change to the piano sound theme takes effect on the very next note.
    const { brightness, sustain } = timbreSettings.get();
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur, br: brightness, su: sustain }))}}));true;`
    );
  }

  function pulse() {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  // ── Cursor: activate note `idx` — snaps there, then glides continuously toward
  // the note that plays next, timed to its actual on-screen duration, so the
  // cursor never stops moving mid-line. ────────────────────────────────────
  function playSequence(noteList: GeneratedNote[], idx: number) {
    if (idx >= noteList.length) {
      setIsPlaying(false);
      setHighlightedIndices([]);
      cursor.reset();
      if (noteList.length > 0) {
        const totalBeats = noteList.reduce((sum, n) => sum + (DURATION_BEATS[n.duration] ?? 1), 0);
        recordSession({ mode: 'playback', minutes: totalBeats / level.bpm });
      }
      return;
    }

    const secPerBeat = 60 / level.bpm;

    if (isSimultaneous) {
      const highlighted = [idx, idx + 1].filter(i => i < noteList.length);
      setHighlightedIndices(highlighted);
      pulse();

      const dur1 = (DURATION_BEATS[noteList[idx].duration] ?? 1) * secPerBeat;
      noteList[idx].keys.forEach(k => sendNote(noteToFreq(k), dur1 * 0.9));
      if (idx + 1 < noteList.length) {
        const dur2 = (DURATION_BEATS[noteList[idx + 1].duration] ?? 1) * secPerBeat;
        noteList[idx + 1].keys.forEach(k => sendNote(noteToFreq(k), dur2 * 0.9));
      }
      const nextIdx = idx + 2 < noteList.length ? idx + 2 : null;
      cursor.activate(idx, nextIdx, dur1 * 1000);
      timeoutRef.current = setTimeout(() => playSequence(noteList, idx + 2), dur1 * 1000);
    } else {
      setHighlightedIndices([idx]);
      pulse();

      const note = noteList[idx];
      const dur = (DURATION_BEATS[note.duration] ?? 1) * secPerBeat;
      note.keys.forEach(k => sendNote(noteToFreq(k), dur * 0.9));
      const nextIdx = idx + 1 < noteList.length ? idx + 1 : null;
      cursor.activate(idx, nextIdx, dur * 1000);
      timeoutRef.current = setTimeout(() => playSequence(noteList, idx + 1), dur * 1000);
    }
  }

  function handlePlay() {
    if (isPlaying) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsPlaying(false);
      setHighlightedIndices([]);
      cursor.reset();
      return;
    }
    setIsPlaying(true);
    playSequence(notes, 0);
  }

  const pending: ('correct' | 'wrong' | 'pending')[] = notes.map(() => 'pending');
  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      <View style={styles.hidden}>
        <WebView ref={synthRef} source={{ html: synthHtml }} javaScriptEnabled originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); navigation.goBack(); }}>
            <Text style={styles.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={styles.levelLabel}>{t.listenLabel} · {t.levelLabel} {levelId}</Text>
        </View>

        {/* Play button ABOVE the sheet music so it's always visible */}
        <View style={styles.controls}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={[styles.playBtn, isPlaying && styles.stopBtn]} onPress={handlePlay}>
              <Text style={styles.playBtnTxt}>{isPlaying ? t.stopBtn : t.playBtn}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.bpm}>{level.bpm} BPM · {keySignature} · {t.tempo}</Text>
        </View>

        {notes.length > 0 && (
          <View style={{ position: 'relative' }}>
            <SheetMusic
              notes={notes}
              highlightedIndices={highlightedIndices}
              noteResults={pending}
              keySignature={keySignature}
              timeSignature={[4, 4]}
              onNotePositions={cursor.setPositions}
              colorfulNotes={settings.colorfulNotes}
              staffScale={settings.staffSize}
              darkMode={isDark}
            />
            <PlaybackCursor
              cursorXAnim={cursorXAnim}
              lineIdx={cursorLineIdx}
              isGrand={isGrand}
              staffScale={settings.staffSize}
              color={C.primary}
              visible={isPlaying}
            />
          </View>
        )}

        <TouchableOpacity style={styles.newBtn} onPress={generate}>
          <Text style={styles.newBtnTxt}>{t.newNotes}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    hidden: { width: 1, height: 1, opacity: 0 },
    container: { padding: 16, paddingBottom: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    back: { fontSize: 16, color: C.primary, fontWeight: '600' },
    levelLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    playBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 50, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    stopBtn: { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
    playBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
    bpm: { color: C.muted, fontSize: 13, flex: 1 },
    newBtn: { backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, marginTop: 20 },
    newBtnTxt: { color: C.text, fontSize: 15, fontWeight: '600' },
  });
}
