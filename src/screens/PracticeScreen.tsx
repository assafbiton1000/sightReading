import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { generateExercise, getRandomKeySignature, GeneratedNote, BothMode } from '../utils/noteGenerator';
import { isNoteMatch, noteToFreq } from '../utils/musicTheory';
import { DURATION_BEATS } from '../constants/notes';
import { useMetronome } from '../utils/useMetronome';
import { timbreSettings } from '../utils/timbreSettings';
import { buildSynthHtml } from '../utils/pianoSynthHtml';
import SheetMusic from '../components/SheetMusic';
import PlaybackCursor, { usePlaybackCursor } from '../components/PlaybackCursor';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';
import { useLang } from '../context/LangContext';
import { useSettings } from '../context/SettingsContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, useIsDark, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

type Route = RouteProp<RootStackParamList, 'Practice'>;
type Nav = StackNavigationProp<RootStackParamList, 'Practice'>;
type NoteResult = 'correct' | 'wrong' | 'pending';
type Phase = 'idle' | 'countdown' | 'playing' | 'done';
type Styles = ReturnType<typeof makeStyles>;

export default function PracticeScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode, song } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const bpm = song?.bpm ?? level.bpm;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';
  const { t } = useLang();
  const { settings } = useSettings();
  const { stats, recordSession } = useHistory();
  const C = useTheme();
  const isDark = useIsDark();
  const styles = makeStyles(C);

  // Tracks the latest streak/accuracy so Result can show what changed. Kept fresh on
  // every render (not just mount) rather than snapshotted once, because "Try Again
  // Same" navigates back to this exact screen instance instead of remounting it —
  // a mount-only snapshot would go stale across repeated attempts in the same visit.
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; });

  // ── State ──────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [keySignature, setKeySignature] = useState('C');
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [noteResults, setNoteResults] = useState<NoteResult[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [beatIndicator, setBeatIndicator] = useState(false);
  const [metronomeMuted, setMetronomeMuted] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────
  const pitchRef = useRef<PitchDetectorHandle>(null);
  const synthRef = useRef<WebView>(null);
  const currentIdxRef = useRef(-1);
  const notesRef = useRef<GeneratedNote[]>([]);
  const resultsRef = useRef<NoteResult[]>([]);
  const beatCountRef = useRef(0);
  const noteStartBeatRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Playback cursor ───────────────────────────────────────────────
  const [cursor, cursorXAnim, cursorLineIdx] = usePlaybackCursor();
  const synthHtml = useRef((() => { const t = timbreSettings.get(); return buildSynthHtml(t.brightness, t.sustain); })()).current;

  // Keep refs in sync
  useEffect(() => { currentIdxRef.current = currentNoteIdx; }, [currentNoteIdx]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Request microphone permission on mount ─────────────────────────
  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => {
      if (!granted) {
        Alert.alert(
          'נדרשת גישה למיקרופון',
          'כדי לזהות תווים שאתה מנגן, האפליקציה צריכה גישה למיקרופון. אנא אשר בהגדרות.',
          [{ text: 'אישור' }]
        );
      }
    });
  }, []);

  // ── Generate exercise ONCE on mount — or load a fixed song, if given ─
  function generateNewExercise() {
    const generated = song ? song.notes : generateExercise(level, clef, noteCount, bothMode);
    const keySig = song ? 'C' : getRandomKeySignature(level.maxSharpsFlats);
    const pending: NoteResult[] = generated.map(() => 'pending');
    setNotes(generated);
    notesRef.current = generated;
    setKeySignature(keySig);
    setNoteResults(pending);
    resultsRef.current = pending;
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    cursor.reset();
    cursor.setPositions([]);
  }

  useEffect(() => { generateNewExercise(); }, []);

  // ── Synth: play a note by frequency ────────────────────────────────
  function playSound(freq: number) {
    // Read live (not the snapshot the WebView HTML was built with) so a Settings
    // change to the piano sound theme takes effect on the very next note.
    const { brightness, sustain } = timbreSettings.get();
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur: 0.5, br: brightness, su: sustain }))}}));true;`
    );
  }

  // ── Cursor: activate note `idx` — snaps there, then glides continuously
  // toward the note that will become current next, timed to the actual tempo,
  // so the cursor never stops moving mid-line. ─────────────────────────
  const activateNote = useCallback((idx: number) => {
    const ns = notesRef.current;

    // Play guide sound immediately
    if (settings.audioFeedback) {
      [idx, isSimultaneous ? idx + 1 : -1].forEach(i => {
        if (i >= 0 && i < ns.length) ns[i].keys.forEach(k => playSound(noteToFreq(k)));
      });
    }

    const step = isSimultaneous ? 2 : 1;
    const nextIdx = idx + step < ns.length ? idx + step : null;
    const noteDurationBeats = DURATION_BEATS[ns[idx]?.duration] ?? 1;
    const durationMs = (60 / bpm) * 1000 * noteDurationBeats;
    cursor.activate(idx, nextIdx, durationMs);
  }, [isSimultaneous, settings.audioFeedback, bpm, cursor]);

  // ── Highlighted indices (blue notes) ───────────────────────────────
  function getHighlighted(idx: number): number[] {
    if (idx < 0) return [];
    if (isSimultaneous && idx % 2 === 0) return [idx, idx + 1]; // highlight pair
    return [idx];
  }

  // ── Metronome tick ─────────────────────────────────────────────────
  const handleTick = useCallback((beat: number) => {
    // pulse animation
    setBeatIndicator(true);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setBeatIndicator(false), 150);

    if (phaseRef.current === 'countdown') {
      const remaining = 4 - beat;
      setCountdown(remaining);
      if (beat >= 3) {
        phaseRef.current = 'playing';
        setPhase('playing');
        beatCountRef.current = 1;
        noteStartBeatRef.current = 0;
        const startIdx = 0;
        setCurrentNoteIdx(startIdx);
        currentIdxRef.current = startIdx;
        pitchRef.current?.start();
        activateNote(startIdx);
      }
      return;
    }

    if (phaseRef.current !== 'playing') return;

    const idx = currentIdxRef.current;
    const ns = notesRef.current;
    if (idx < 0 || idx >= ns.length) return;

    // For simultaneous mode, step by 2 per beat-group
    const step = isSimultaneous ? 2 : 1;
    const note = ns[idx];
    const noteDurationBeats = DURATION_BEATS[note.duration] ?? 1;
    const elapsed = beatCountRef.current - noteStartBeatRef.current;

    if (elapsed >= noteDurationBeats) {
      // Time's up — mark pending notes as wrong
      const results = [...resultsRef.current];
      const toMark = isSimultaneous ? [idx, idx + 1] : [idx];
      toMark.forEach(i => { if (i < ns.length && results[i] === 'pending') results[i] = 'wrong'; });
      resultsRef.current = results;
      setNoteResults([...results]);

      const nextIdx = idx + step;
      if (nextIdx >= ns.length) {
        phaseRef.current = 'done';
        setPhase('done');
        stopMetronome();
        pitchRef.current?.stop();
        setCurrentNoteIdx(-1);
        cursor.reset();
        const correct = results.filter(r => r === 'correct').length;
        const totalBeats = ns.reduce((sum, n) => sum + (DURATION_BEATS[n.duration] ?? 1), 0);
        // Read the pre-session snapshot before recordSession updates it.
        const { streak: prevStreak, avgAccuracy: prevAvgAccuracy } = statsRef.current;
        recordSession({ mode: 'practice', minutes: totalBeats / bpm, correct, total: ns.length });
        setTimeout(() => navigation.navigate('Result', {
          correct, total: ns.length, levelId, clef, noteCount, bothMode, prevStreak, prevAvgAccuracy,
        }), 800);
      } else {
        setCurrentNoteIdx(nextIdx);
        currentIdxRef.current = nextIdx;
        noteStartBeatRef.current = beatCountRef.current;
        activateNote(nextIdx);
      }
    }
    beatCountRef.current += 1;
  }, [isSimultaneous, activateNote, cursor]);

  const { start: startMetronome, stop: stopMetronome } = useMetronome(bpm, handleTick, metronomeMuted);

  // ── Start: resets results but KEEPS same notes ─────────────────────
  function handleStart() {
    if (phase === 'playing' || phase === 'countdown') return;
    stopMetronome(); // clear any lingering interval before restarting
    const pending: NoteResult[] = notesRef.current.map(() => 'pending');
    setNoteResults(pending);
    resultsRef.current = pending;
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    beatCountRef.current = 0;
    noteStartBeatRef.current = 0;

    if (!settings.countIn) {
      // Skip the count-in: jump straight to playing the first note
      phaseRef.current = 'playing';
      setPhase('playing');
      beatCountRef.current = 1;
      setCurrentNoteIdx(0);
      currentIdxRef.current = 0;
      pitchRef.current?.start();
      activateNote(0);
      startMetronome();
      return;
    }

    setPhase('countdown');
    phaseRef.current = 'countdown';
    setCountdown(4);
    startMetronome();
  }

  function handleStop() {
    stopMetronome();
    pitchRef.current?.stop();
    setPhase('idle');
    phaseRef.current = 'idle';
    setCurrentNoteIdx(-1);
    cursor.reset();
  }

  // ── Pitch detection — only marks notes correct/wrong, cursor drives advancement
  const handlePitch = useCallback((freq: number) => {
    if (phaseRef.current !== 'playing') return;
    const idx = currentIdxRef.current;
    const ns = notesRef.current;
    if (idx < 0 || idx >= ns.length) return;

    const toCheck = isSimultaneous ? [idx, idx + 1] : [idx];
    toCheck.forEach(i => {
      if (i >= ns.length) return;
      if (resultsRef.current[i] !== 'pending') return;
      if (ns[i].keys.some(k => isNoteMatch(freq, k))) {
        const results = [...resultsRef.current];
        results[i] = 'correct';
        resultsRef.current = results;
        setNoteResults([...results]);
      }
    });
  }, [isSimultaneous]);

  const correctCount = noteResults.filter(r => r === 'correct').length;
  const wrongCount = noteResults.filter(r => r === 'wrong').length;
  const displayResults: NoteResult[] = settings.liveErrorFeedback || phase === 'done'
    ? noteResults
    : noteResults.map(() => 'pending');
  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      {/* Hidden: pitch detector */}
      <PitchDetectorView ref={pitchRef} onPitchDetected={handlePitch} sensitivity={settings.micSensitivity} />
      {/* Hidden: synth for note sound feedback */}
      <View style={styles.hidden}>
        <WebView ref={synthRef} source={{ html: synthHtml }} javaScriptEnabled originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { handleStop(); navigation.goBack(); }}>
            <Text style={styles.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={styles.levelLabel}>
            {song ? song.name : `${t.levelLabel} ${levelId} · ${t.levelNames[level.id - 1]}`}
          </Text>
        </View>

        {/* Score row */}
        <View style={styles.scoreRow}>
          <ScoreChip label={t.correctLabel} count={correctCount} color="#22c55e" styles={styles} />
          <Animated.View style={[styles.beatDot, {
            transform: [{ scale: pulseAnim }],
            backgroundColor: beatIndicator ? C.primary : C.border,
          }]} />
          <TouchableOpacity onPress={() => setMetronomeMuted(m => !m)} style={styles.muteBtn}>
            <Text style={styles.muteBtnTxt}>{metronomeMuted ? '🔕' : '🔔'}</Text>
          </TouchableOpacity>
          <ScoreChip label={t.wrongLabel} count={wrongCount} color="#ef4444" styles={styles} />
        </View>

        {/* Sheet music + cursor overlay */}
        {notes.length > 0 && (
          <View style={{ position: 'relative' }}>
            <SheetMusic
              notes={notes}
              highlightedIndices={getHighlighted(currentNoteIdx)}
              noteResults={displayResults}
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
              visible={phase === 'playing'}
            />
          </View>
        )}

        {/* Countdown overlay */}
        {phase === 'countdown' && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Progress */}
        {phase === 'playing' && currentNoteIdx >= 0 && (
          <Text style={styles.progress}>
            {t.noteProgress.replace('{n}', String(Math.floor(currentNoteIdx / (isSimultaneous ? 2 : 1)) + 1)).replace('{total}', String(notes.length / (isSimultaneous ? 2 : 1)))}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.btnArea}>
          {(phase === 'idle' || phase === 'done') && (
            <>
              <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                <Text style={styles.startBtnTxt}>{phase === 'done' ? t.tryAgain : t.startBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newBtn} onPress={generateNewExercise}>
                <Text style={styles.newBtnTxt}>{t.newExercise}</Text>
              </TouchableOpacity>
            </>
          )}
          {(phase === 'playing' || phase === 'countdown') && (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.startBtnTxt}>{t.stop}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.bpmLabel}>{bpm} BPM · {keySignature}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreChip({ label, count, color, styles }: { label: string; count: number; color: string; styles: Styles }) {
  return (
    <View style={[styles.scoreChip, { borderColor: color }]}>
      <Text style={[styles.scoreCount, { color }]}>{count}</Text>
      <Text style={styles.scoreLbl}>{label}</Text>
    </View>
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
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.card },
    scoreCount: { fontSize: 22, fontWeight: '800' },
    scoreLbl: { fontSize: 12, color: C.muted, fontWeight: '600' },
    beatDot: { width: 18, height: 18, borderRadius: 9 },
    muteBtn: { padding: 4 },
    muteBtnTxt: { fontSize: 18 },
    countdownBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: C.overlay, zIndex: 10 },
    countdownText: { fontSize: 100, fontWeight: '900', color: C.primary },
    progress: { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 10 },
    btnArea: { marginTop: 24, gap: 10 },
    startBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    startBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
    newBtn: { backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    newBtnTxt: { color: C.text, fontSize: 15, fontWeight: '600' },
    stopBtn: { backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    bpmLabel: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 12 },
  });
}
