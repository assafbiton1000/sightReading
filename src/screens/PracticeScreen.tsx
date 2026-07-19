import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { generateExercise, getRandomKeySignature, GeneratedNote } from '../utils/noteGenerator';
import { isNoteMatch, noteToFreq } from '../utils/musicTheory';
import { DURATION_BEATS, NOTE_FREQUENCIES } from '../constants/notes';
import { useMetronome } from '../utils/useMetronome';
import { timbreSettings } from '../utils/timbreSettings';
import { buildSynthHtml } from '../utils/pianoSynthHtml';
import SheetMusic, { NotePosition, SheetMusicHandle } from '../components/SheetMusic';
import { getCursorMetrics } from '../components/PlaybackCursor';
import PianoKeyboard from '../components/PianoKeyboard';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';
import { useLang } from '../context/LangContext';
import { useSettings } from '../context/SettingsContext';
import { useHistory } from '../context/HistoryContext';
import { useTheme, useIsDark, ThemeColors } from '../utils/theme';
import AppHeader from '../components/AppHeader';

// ─────────────────────────────────────────────────────────────────────────────
// Practice is played at the USER's tempo: there is no metronome, no guide
// sounds, no cursor and no highlight — the only audio in the room is the
// player's own piano. Detected notes drive advancement through the sheet, and
// the performance (pitch AND relative rhythm) is analyzed only after the last
// note, then shown as colors on the sheet + a final score.
// ─────────────────────────────────────────────────────────────────────────────

type Route = RouteProp<RootStackParamList, 'Practice'>;
type Nav = StackNavigationProp<RootStackParamList, 'Practice'>;
type NoteResult = 'correct' | 'wrong' | 'rhythm' | 'skipped' | 'pending';
// 'demo' = the optional post-exercise replay of the CORRECT performance.
type Phase = 'idle' | 'playing' | 'done' | 'demo';
type Styles = ReturnType<typeof makeStyles>;

const BEATS_PER_MEASURE = 4; // fixed 4/4 — must match the timeSignature passed to SheetMusic

// Stable empty array — an inline [] would give SheetMusic a new reference every render.
const NO_INDICES: number[] = [];

// ── Note-event segmentation (turning the continuous pitch stream into strikes) ──
// A piano note keeps being detected for as long as it rings, so a raw detection
// is NOT a new strike. A new strike is: a different pitch, the same pitch after
// a silence gap, or — only when the sheet actually asks for a repeated note —
// the same pitch again after a cooldown (a re-strike never breaks the pitch
// stream, so a repeat can't be told apart from ringing any other way).
const RING_GAP_MS = 300;
const REPEAT_MS = 600;
// After this many wrong strikes on one slot it's marked wrong and skipped, so a
// note the mic can't hear can never deadlock the exercise.
const MAX_WRONG_ATTEMPTS = 3;

// ── Free-tempo rhythm analysis ──
// There is no absolute tempo to compare against, so rhythm is judged relatively:
// each note's actual time-to-next-note is divided by its expected length in
// beats, the median of those ratios is the player's own implied tempo, and a
// note is flagged only when it deviates wildly from the player's own pace.
const RHYTHM_MIN_INTERVALS = 3;
const RHYTHM_SLOW_RATIO = 1.4;
const RHYTHM_FAST_RATIO = 0.55;

// ── Live timing feedback ──
// Once the player's own pace is established (2+ clean intervals), timing errors
// show in real time: a note the player hesitates on turns orange WHILE they are
// stuck on it (watchdog), and a note struck far too early turns orange the
// moment it lands. The end-of-exercise analysis then re-derives every rhythm
// flag from the complete performance, so live marks and final marks agree. The
// orange always sits on the ARRIVING note — the one that came late/early.
const LIVE_MIN_INTERVALS = 2;
const WATCHDOG_MS = 250;

// Per-note timeline along the play order: musical start beat + logical measure
// index (4-beat groups). In simultaneous mode a treble+bass pair shares a slot.
function computeSlotTimeline(ns: GeneratedNote[], simultaneous: boolean): { startBeats: number[]; measures: number[] } {
  const startBeats = new Array<number>(ns.length).fill(0);
  const measures = new Array<number>(ns.length).fill(0);
  let beat = 0;
  const step = simultaneous ? 2 : 1;
  for (let i = 0; i < ns.length; i += step) {
    startBeats[i] = beat;
    measures[i] = Math.floor(beat / BEATS_PER_MEASURE);
    if (simultaneous && i + 1 < ns.length) {
      startBeats[i + 1] = startBeats[i];
      measures[i + 1] = measures[i];
    }
    beat += DURATION_BEATS[ns[i].duration] ?? 1;
  }
  return { startBeats, measures };
}

// Snap a detected frequency to the note name it matches (within pitch
// tolerance), or null when it isn't close enough to any known note.
function freqToNoteName(freq: number): string | null {
  for (const name of Object.keys(NOTE_FREQUENCIES)) {
    if (isNoteMatch(freq, name)) return name;
  }
  return null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function PracticeScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode, song } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  // Practice itself is free-tempo; this nominal tempo is only used to time the
  // correct-performance replay.
  const demoBpm = song?.bpm ?? level.bpm;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';
  const slotStep = isSimultaneous ? 2 : 1;
  const { t } = useLang();
  const { settings } = useSettings();
  // 'midi' input source = the on-screen piano keyboard; taps replace the mic.
  const useOnScreenKeyboard = settings.audioInputSource === 'midi';
  const { stats, recordSession } = useHistory();

  // Optional practice metronome — an audio aid ONLY. It has no tick callback
  // into the engine, so it cannot influence advancement, analysis or the score;
  // the performance is still judged by the player's own relative rhythm.
  const { start: startMetronome, stop: stopMetronome } = useMetronome(settings.metronomeBpm, {
    volume: settings.metronomeVolume,
    accentEvery: settings.metronomeAccent ? BEATS_PER_MEASURE : 0,
  });
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
  // Brief "Start playing" cue shown for the first second after Start — free-tempo
  // practice has no count-in, so this just tells the player the app is listening now.
  const [showStartHint, setShowStartHint] = useState(false);
  const startHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────
  const pitchRef = useRef<PitchDetectorHandle>(null);
  // Synth for the on-screen keyboard only — its sound IS the user's playing,
  // so it doesn't violate the "only the user's audio during practice" rule.
  const synthRef = useRef<WebView>(null);
  const synthHtml = useRef((() => { const ts = timbreSettings.get(); return buildSynthHtml(ts.brightness, ts.sustain); })()).current;
  const currentIdxRef = useRef(-1);
  const notesRef = useRef<GeneratedNote[]>([]);
  const resultsRef = useRef<NoteResult[]>([]);
  const phaseRef = useRef<Phase>('idle');

  // Per-slot progress: which pair members were already matched, and how many
  // wrong strikes were spent on the current slot.
  const slotMatchedRef = useRef<Set<number>>(new Set());
  const slotAttemptsRef = useRef(0);
  // Timestamp per consumed slot — the raw material for the rhythm analysis.
  const onsetsRef = useRef<number[]>([]);
  const sessionStartRef = useRef(0);
  // Live pace tracking (real-time timing feedback): clean interval ratios so
  // far, plus when/what the previously consumed slot was.
  const liveRatiosRef = useRef<number[]>([]);
  const lastOnsetAtRef = useRef(0);
  const lastSlotBeatsRef = useRef(0);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Note-event segmentation state (see constants above).
  const lastEventNoteRef = useRef<string | null>(null);
  const lastEventAtRef = useRef(0);
  const lastSeenAtRef = useRef(0);
  // Final numbers, held for the "show score" button after the exercise ends.
  const finishedRef = useRef<{ correct: number; total: number; rhythmErrors: number; skipped: number; prevStreak: number; prevAvgAccuracy: number | null } | null>(null);
  // Every strike the player actually made this run (right or wrong pitch, real
  // timestamp) — replayed verbatim by the "hear how you played" button.
  const playedEventsRef = useRef<{ freq: number; at: number; idx: number }[]>([]);

  // ── Auto-follow scrolling — with the on-screen keyboard fixed at the bottom
  // of the screen (outside the ScrollView, so drags over it never mis-fire a
  // key), the sheet still needs to scroll itself so the line the player has
  // reached stays visible above the keyboard, same idea as Playback's cursor-follow. ──
  const scrollRef = useRef<ScrollView>(null);
  const sheetYRef = useRef(0);
  const sheetRef = useRef<SheetMusicHandle>(null);
  const notePositionsRef = useRef<NotePosition[]>([]);
  const lastAutoScrollLineRef = useRef(-1);
  const handleNotePositions = useCallback((positions: NotePosition[]) => {
    notePositionsRef.current = positions;
    // The WebView just (re)rendered, wiping its arrow — re-assert the current one.
    if (phaseRef.current === 'playing' && currentIdxRef.current >= 0) {
      sheetRef.current?.setArrow(currentIdxRef.current);
    }
  }, []);

  // ── Arrow above the staff, pointing down at the current note — playing only,
  // so it never distracts during idle/review/demo. Drawn inside the WebView
  // (see SheetMusicHandle) — a native overlay here used to vanish behind the
  // sheet card's Android elevation. ──
  useEffect(() => {
    sheetRef.current?.setArrow(phase === 'playing' && currentNoteIdx >= 0 ? currentNoteIdx : null);
  }, [currentNoteIdx, phase]);

  // ── Disappearing measures ─────────────────────────────────────────
  const [hiddenIndices, setHiddenIndices] = useState<number[]>(NO_INDICES);
  const hiddenKeyRef = useRef('');
  const measureIdxRef = useRef<number[]>([]);
  const startBeatsRef = useRef<number[]>([]);

  const resetHidden = useCallback(() => {
    hiddenKeyRef.current = '';
    setHiddenIndices(NO_INDICES);
  }, []);

  // Recompute which notes are hidden for playhead position `playheadBeat`.
  // With free tempo there is no beat clock — the playhead is simply the musical
  // start beat of the note the player has reached.
  const updateHiddenMeasures = useCallback((playheadBeat: number) => {
    if (!settings.disappearingMeasures) return;
    const timing = settings.disappearingMeasuresTiming;
    const M = Math.floor(playheadBeat / BEATS_PER_MEASURE);
    const beatsInto = playheadBeat - M * BEATS_PER_MEASURE;
    const hidden: number[] = [];
    measureIdxRef.current.forEach((m, i) => {
      const hide = timing === 'onEntry' ? m <= M
        : timing === 'delayed' ? m < M || (m === M && beatsInto >= BEATS_PER_MEASURE / 2)
        : m < M; // 'afterEnd'
      if (hide) hidden.push(i);
    });
    const key = hidden.join(',');
    if (key === hiddenKeyRef.current) return;
    hiddenKeyRef.current = key;
    setHiddenIndices(hidden);
  }, [settings.disappearingMeasures, settings.disappearingMeasuresTiming]);

  // Keep refs in sync
  useEffect(() => { currentIdxRef.current = currentNoteIdx; }, [currentNoteIdx]);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // While playing with the on-screen keyboard, scroll the sheet to keep the
  // current note's staff line visible above the fixed keyboard footer — the
  // keyboard itself never moves, only the sheet scrolls to follow along.
  useEffect(() => {
    if (phase !== 'playing' || !useOnScreenKeyboard || currentNoteIdx < 0) return;
    const pos = notePositionsRef.current.find(p => p.idx === currentNoteIdx);
    if (!pos || pos.lineIdx === lastAutoScrollLineRef.current) return;
    // Line 0 is already at the top — handleStart just did an explicit scrollTo(0).
    // Computing its y from sheetYRef here would race the layout shrink that
    // happens the instant 'playing' hides the controls/score row above the
    // sheet: this effect can run with the stale (taller) offset and overshoot
    // past the first line before onLayout catches up.
    if (pos.lineIdx === 0) { lastAutoScrollLineRef.current = 0; return; }
    lastAutoScrollLineRef.current = pos.lineIdx;
    const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');
    const { systemH } = getCursorMetrics(isGrand, settings.staffSize);
    const y = Math.max(0, sheetYRef.current + pos.lineIdx * systemH - 20);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, [currentNoteIdx, phase, useOnScreenKeyboard, notes, settings.staffSize]);

  // ── Request microphone permission on mount (mic input only) ────────
  useEffect(() => {
    if (useOnScreenKeyboard) return; // keyboard input needs no permissions
    Audio.requestPermissionsAsync().then(({ granted }) => {
      if (!granted) {
        Alert.alert(
          'נדרשת גישה למיקרופון',
          'כדי לזהות תווים שאתה מנגן, האפליקציה צריכה גישה למיקרופון. אנא אשר בהגדרות.',
          [{ text: 'אישור' }]
        );
      }
    });
  }, [useOnScreenKeyboard]);

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
    const { startBeats, measures } = computeSlotTimeline(generated, isSimultaneous);
    startBeatsRef.current = startBeats;
    measureIdxRef.current = measures;
    finishedRef.current = null;
    resetHidden();
    setPhase('idle');
    phaseRef.current = 'idle';
  }

  useEffect(() => { generateNewExercise(); }, []);

  // Members of the slot that starts at note index `idx` (a pair in simultaneous mode).
  const slotMembers = useCallback((idx: number): number[] => {
    const ns = notesRef.current;
    return isSimultaneous && idx + 1 < ns.length ? [idx, idx + 1] : [idx];
  }, [isSimultaneous]);

  // ── End of performance: relative-rhythm analysis + final bookkeeping ─
  const finishExercise = useCallback(() => {
    const ns = notesRef.current;
    pitchRef.current?.stop();
    if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    resetHidden(); // show the full sheet again — this is where the errors are reviewed

    // Rhythm: time between consecutive onsets vs the note's expected beats,
    // normalized by the player's own median pace. The last note has no "next
    // onset" so its length can't be judged.
    const onsets = onsetsRef.current;
    // The final pass is authoritative: live rhythm marks are cleared and every
    // flag is re-derived from the complete performance's median pace.
    const results: NoteResult[] = resultsRef.current.map(r => (r === 'rhythm' ? 'correct' : r));
    const slotFirsts: number[] = [];
    for (let i = 0; i < ns.length; i += slotStep) slotFirsts.push(i);
    const ratios: { slot: number; ratio: number }[] = [];
    for (let s = 0; s + 1 < onsets.length; s++) {
      // An interval that ends in a fumbled slot is polluted: the time spent
      // hunting for the next note inflates THIS note's measured length, which
      // would mislabel a pitch problem as a rhythm problem.
      const nextClean = slotMembers(slotFirsts[s + 1]).every(i => results[i] === 'correct');
      if (!nextClean) continue;
      const beats = DURATION_BEATS[ns[slotFirsts[s]].duration] ?? 1;
      const dt = onsets[s + 1] - onsets[s];
      if (dt > 0 && beats > 0) ratios.push({ slot: s, ratio: dt / beats });
    }
    let rhythmErrors = 0;
    if (ratios.length >= RHYTHM_MIN_INTERVALS) {
      const pace = median(ratios.map(r => r.ratio)); // the player's own ms-per-beat
      ratios.forEach(({ slot, ratio }) => {
        const dev = ratio / pace;
        if (dev > RHYTHM_SLOW_RATIO || dev < RHYTHM_FAST_RATIO) {
          // The orange sits on the ARRIVING note — the one struck too late or
          // too early — matching the live indication. Red (pitch) still wins.
          slotMembers(slotFirsts[slot + 1]).forEach(i => {
            if (results[i] === 'correct') { results[i] = 'rhythm'; rhythmErrors++; }
          });
        }
      });
    }
    resultsRef.current = results;
    setNoteResults([...results]);

    // A rhythm-flagged note was still the right pitch — it counts for the score.
    const correct = results.filter(r => r === 'correct' || r === 'rhythm').length;
    const skipped = results.filter(r => r === 'skipped').length;
    const minutes = sessionStartRef.current > 0 ? (Date.now() - sessionStartRef.current) / 60000 : 0;
    // Read the pre-session snapshot before recordSession updates it.
    const { streak: prevStreak, avgAccuracy: prevAvgAccuracy } = statsRef.current;
    recordSession({ mode: 'practice', minutes, correct, total: ns.length, level: levelId });
    finishedRef.current = { correct, total: ns.length, rhythmErrors, skipped, prevStreak, prevAvgAccuracy };

    stopMetronome();
    setPhase('done');
    phaseRef.current = 'done';
  }, [slotStep, slotMembers, resetHidden, recordSession, stopMetronome]);

  // ── A slot is consumed by whatever the player struck (or by a skip) ──
  const consumeSlot = useCallback((now: number) => {
    const ns = notesRef.current;
    const idx = currentIdxRef.current;
    const members = slotMembers(idx);
    const results = [...resultsRef.current];
    members.forEach(i => {
      results[i] = slotMatchedRef.current.has(i) && slotAttemptsRef.current === 0 ? 'correct' : 'wrong';
    });

    // Record onset for the post-exercise rhythm analysis (finishExercise reads onsetsRef).
    resultsRef.current = results;
    // No setNoteResults here — colors are shown only at finishExercise.
    onsetsRef.current.push(now);
    lastOnsetAtRef.current = now;
    lastSlotBeatsRef.current = DURATION_BEATS[ns[idx]?.duration] ?? 1;
    slotMatchedRef.current = new Set();
    slotAttemptsRef.current = 0;

    const nextIdx = idx + slotStep;
    if (nextIdx >= ns.length) {
      finishExercise();
    } else {
      setCurrentNoteIdx(nextIdx);
      currentIdxRef.current = nextIdx;
      updateHiddenMeasures(startBeatsRef.current[nextIdx] ?? 0);
    }
  }, [slotMembers, slotStep, finishExercise, updateHiddenMeasures]);

  const handleNoteEvent = useCallback((note: string, now: number) => {
    const ns = notesRef.current;
    const idx = currentIdxRef.current;
    if (idx < 0 || idx >= ns.length) return;

    playedEventsRef.current.push({ freq: noteToFreq(note), at: now, idx });

    const pending = slotMembers(idx).filter(i => !slotMatchedRef.current.has(i));
    const hit = pending.find(i => ns[i].keys.includes(note));
    if (hit !== undefined) {
      slotMatchedRef.current.add(hit);
      const allMatched = slotMembers(idx).every(i => slotMatchedRef.current.has(i));
      if (allMatched) consumeSlot(now);
    } else {
      slotAttemptsRef.current += 1;
      consumeSlot(now); // wrong note → skip immediately, record as wrong
    }
  }, [slotMembers, consumeSlot]);

  // ── Pitch stream → discrete strikes → slot advancement ─────────────
  const handlePitch = useCallback((freq: number) => {
    if (phaseRef.current !== 'playing') return;
    const note = freqToNoteName(freq);
    if (!note) return;
    const now = Date.now();

    if (note === lastEventNoteRef.current) {
      const silenceGap = now - lastSeenAtRef.current >= RING_GAP_MS;
      const idx = currentIdxRef.current;
      const ns = notesRef.current;
      const slotWantsThisNote = idx >= 0 && idx < ns.length &&
        slotMembers(idx).some(i => !slotMatchedRef.current.has(i) && ns[i].keys.includes(note));
      const repeatRescue = slotWantsThisNote && now - lastEventAtRef.current >= REPEAT_MS;
      lastSeenAtRef.current = now;
      if (!silenceGap && !repeatRescue) return; // still the same ringing note
    }

    lastEventNoteRef.current = note;
    lastSeenAtRef.current = now;
    lastEventAtRef.current = now;
    handleNoteEvent(note, now);
  }, [slotMembers, handleNoteEvent]);

  // ── On-screen keyboard input ────────────────────────────────────────
  const playSound = useCallback((freq: number) => {
    // Read live (not the snapshot the WebView HTML was built with) so a Settings
    // change to the piano sound theme takes effect on the very next note.
    const { brightness, sustain } = timbreSettings.get();
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur: 0.5, br: brightness, su: sustain }))}}));true;`
    );
  }, []);

  // A tap is already a discrete strike — it skips the mic's ring/repeat
  // segmentation entirely and goes straight into the engine.
  const handleKeyPress = useCallback((note: string, freq: number) => {
    playSound(freq);
    if (phaseRef.current !== 'playing') return;
    handleNoteEvent(note, Date.now());
  }, [playSound, handleNoteEvent]);


  // ── Start: resets results but KEEPS same notes. No count-in — the app starts
  // listening immediately and the player sets the pace. ─
  function handleStart() {
    if (phase === 'playing' || phase === 'demo') return;
    const pending: NoteResult[] = notesRef.current.map(() => 'pending');
    setNoteResults(pending);
    resultsRef.current = pending;
    setCurrentNoteIdx(0);
    currentIdxRef.current = 0;
    slotMatchedRef.current = new Set();
    slotAttemptsRef.current = 0;
    onsetsRef.current = [];
    playedEventsRef.current = [];
    lastEventNoteRef.current = null;
    lastEventAtRef.current = 0;
    lastSeenAtRef.current = 0;
    sessionStartRef.current = Date.now();
    liveRatiosRef.current = [];
    lastOnsetAtRef.current = 0;
    lastSlotBeatsRef.current = 0;
    finishedRef.current = null;
    lastAutoScrollLineRef.current = -1;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    resetHidden();
    setPhase('playing');
    phaseRef.current = 'playing';
    updateHiddenMeasures(0);
    if (!useOnScreenKeyboard) pitchRef.current?.start();
    if (settings.metronomeEnabled) startMetronome();

    setShowStartHint(true);
    if (startHintTimerRef.current) clearTimeout(startHintTimerRef.current);
    startHintTimerRef.current = setTimeout(() => setShowStartHint(false), 1000);
  }

  function handleStop() {
    if (demoTimerRef.current) { clearTimeout(demoTimerRef.current); demoTimerRef.current = null; }
    if (watchdogRef.current) { clearInterval(watchdogRef.current); watchdogRef.current = null; }
    if (startHintTimerRef.current) { clearTimeout(startHintTimerRef.current); startHintTimerRef.current = null; }
    setShowStartHint(false);
    stopMetronome();
    pitchRef.current?.stop();
    setPhase('idle');
    phaseRef.current = 'idle';
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    resetHidden();
  }

  // ── Stop button while playing: whatever wasn't reached yet counts as wrong,
  // then the exercise ends exactly like a normal finish (rhythm analysis on
  // what WAS played, history save, score screen). ─
  function handleStopExercise() {
    if (phaseRef.current !== 'playing') return;
    const ns = notesRef.current;
    const idx = currentIdxRef.current;
    if (idx >= 0) {
      const results = [...resultsRef.current];
      for (let i = idx; i < ns.length; i++) {
        if (results[i] === 'pending') results[i] = 'skipped';
      }
      resultsRef.current = results;
    }
    finishExercise();
  }

  // ── Correct-performance replay (opt-in, after an imperfect exercise) ─
  // Plays the sheet as written — right pitches at the exercise's nominal tempo —
  // with a moving blue highlight. Review only: nothing here touches results.
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopDemo() {
    if (demoTimerRef.current) { clearTimeout(demoTimerRef.current); demoTimerRef.current = null; }
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    setPhase('done'); // back to the results view — the score button is still there
    phaseRef.current = 'done';
  }

  function startDemo() {
    if (phase !== 'done') return;
    setPhase('demo');
    phaseRef.current = 'demo';
    let i = 0;
    const playNext = () => {
      if (phaseRef.current !== 'demo') return;
      const ns = notesRef.current;
      if (i >= ns.length) { stopDemo(); return; }
      const idx = i;
      slotMembers(idx).forEach(m => ns[m].keys.forEach(k => playSound(noteToFreq(k))));
      setCurrentNoteIdx(idx);
      currentIdxRef.current = idx;
      const beats = DURATION_BEATS[ns[idx].duration] ?? 1;
      i += slotStep;
      demoTimerRef.current = setTimeout(playNext, (60 / demoBpm) * 1000 * beats);
    };
    playNext();
  }

  // ── Own-performance replay (opt-in) ──
  // Plays back exactly what the player struck — right or wrong pitches, at the
  // real gaps between strikes (hesitations and rushes included) — so they can
  // hear their own timing instead of just seeing it in the score.
  function startYourPerformance() {
    if (phase !== 'done') return;
    const events = playedEventsRef.current;
    if (events.length === 0) return;
    setPhase('demo');
    phaseRef.current = 'demo';
    let i = 0;
    const playNext = () => {
      if (phaseRef.current !== 'demo') return;
      if (i >= events.length) { stopDemo(); return; }
      const ev = events[i];
      playSound(ev.freq);
      setCurrentNoteIdx(ev.idx);
      currentIdxRef.current = ev.idx;
      const next = events[i + 1];
      i += 1;
      demoTimerRef.current = setTimeout(playNext, next ? next.at - ev.at : 400);
    };
    playNext();
  }

  useEffect(() => () => {
    if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    if (watchdogRef.current) clearInterval(watchdogRef.current);
    if (startHintTimerRef.current) clearTimeout(startHintTimerRef.current);
  }, []);

  function handleShowScore() {
    const f = finishedRef.current;
    if (!f) return;
    navigation.navigate('Result', {
      correct: f.correct, total: f.total, rhythmErrors: f.rhythmErrors, skipped: f.skipped,
      levelId, clef, noteCount, bothMode,
      prevStreak: f.prevStreak, prevAvgAccuracy: f.prevAvgAccuracy,
    });
  }

  const correctCount = noteResults.filter(r => r === 'correct' || r === 'rhythm').length;
  const wrongCount = noteResults.filter(r => r === 'wrong').length;
  const rhythmCount = noteResults.filter(r => r === 'rhythm').length;
  const skippedCount = noteResults.filter(r => r === 'skipped').length;

  // During playing all notes stay pending — no colors until finishExercise.
  const displayNoteResults: NoteResult[] = phase === 'playing'
    ? notes.map(() => 'pending')
    : noteResults;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      {/* Hidden: pitch detector — the app's only ear; it never makes a sound */}
      {!useOnScreenKeyboard && (
        <PitchDetectorView ref={pitchRef} onPitchDetected={handlePitch} sensitivity={settings.micSensitivity} />
      )}
      {/* Hidden: synth — sounds the on-screen keyboard (the user's instrument)
          and the post-exercise correct-performance replay */}
      <View style={styles.hidden}>
        <WebView ref={synthRef} source={{ html: synthHtml }} javaScriptEnabled originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { handleStop(); navigation.goBack(); }}>
            <Text style={styles.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={styles.levelLabel}>
            {song ? song.name : `${t.levelLabel} ${levelId} · ${t.levelNames[level.id - 1]}`}
          </Text>
        </View>

        {/* Start — above the sheet music, same placement as Playback's Play
            button. Once playing starts, Stop moves to a fixed footer (below)
            so it stays in view the whole time, however far the sheet scrolls. */}
        {phase === 'idle' && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnTxt}>{t.startBtn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Score row — visible only after the exercise, not during playing */}
        {phase !== 'playing' && (
          <View style={styles.scoreRow}>
            <ScoreChip label={t.correctLabel} count={correctCount} color="#22c55e" styles={styles} />
            {phase === 'done' && rhythmCount > 0 && (
              <ScoreChip label={t.rhythmErrorsLabel} count={rhythmCount} color="#f59e0b" styles={styles} />
            )}
            <ScoreChip label={t.wrongLabel} count={wrongCount} color="#ef4444" styles={styles} />
            {phase === 'done' && skippedCount > 0 && (
              <ScoreChip label={t.skippedLabel} count={skippedCount} color="#a855f7" styles={styles} />
            )}
          </View>
        )}

        {/* Sheet music — deliberately no cursor or current-note highlight while
            PRACTICING (unguided, free tempo). The blue highlight appears only
            during the correct-performance replay, where guidance is the point.
            The in-sheet arrow (playing only) just orients the player to where
            they are, without dictating timing. */}
        {notes.length > 0 && (
          <View onLayout={e => { sheetYRef.current = e.nativeEvent.layout.y; }}>
            <SheetMusic
              ref={sheetRef}
              notes={notes}
              highlightedIndices={phase === 'demo' && currentNoteIdx >= 0 ? slotMembers(currentNoteIdx) : NO_INDICES}
              hiddenIndices={hiddenIndices}
              noteResults={displayNoteResults}
              keySignature={keySignature}
              timeSignature={[4, 4]}
              onNotePositions={handleNotePositions}
              colorfulNotes={settings.colorfulNotes}
              staffScale={settings.staffSize}
              darkMode={isDark}
            />
          </View>
        )}

        {/* Progress + listening hint */}
        {phase === 'playing' && currentNoteIdx >= 0 && (
          <>
            <Text style={styles.progress}>
              {t.noteProgress.replace('{n}', String(Math.floor(currentNoteIdx / slotStep) + 1)).replace('{total}', String(Math.ceil(notes.length / slotStep)))}
            </Text>
            {!useOnScreenKeyboard && <Text style={styles.listening}>{t.listeningLabel}</Text>}
          </>
        )}

        {/* Buttons */}
        <View style={styles.btnArea}>
          {phase === 'done' && (
            <>
              <TouchableOpacity style={styles.startBtn} onPress={handleShowScore}>
                <Text style={styles.startBtnTxt}>{t.showScoreBtn}</Text>
              </TouchableOpacity>
              {(wrongCount > 0 || rhythmCount > 0) && (
                <TouchableOpacity style={styles.newBtn} onPress={startDemo}>
                  <Text style={styles.newBtnTxt}>▶ {t.showCorrectBtn}</Text>
                </TouchableOpacity>
              )}
              {playedEventsRef.current.length > 0 && (
                <TouchableOpacity style={styles.newBtn} onPress={startYourPerformance}>
                  <Text style={styles.newBtnTxt}>▶ {t.showYourBtn}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {phase === 'done' && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnTxt}>{t.tryAgain}</Text>
            </TouchableOpacity>
          )}
          {(phase === 'idle' || phase === 'done') && (
            <TouchableOpacity style={styles.newBtn} onPress={generateNewExercise}>
              <Text style={styles.newBtnTxt}>{t.newExercise}</Text>
            </TouchableOpacity>
          )}
          {phase === 'demo' && (
            <TouchableOpacity style={styles.stopBtn} onPress={stopDemo}>
              <Text style={styles.startBtnTxt}>{t.stop}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.keyLabel}>{keySignature}</Text>
      </ScrollView>

      {/* Fixed footer — outside the ScrollView so dragging the sheet to scroll
          can never land on a key and fire a false note, and the keyboard stays
          visible without having to scroll down to it. */}
      {useOnScreenKeyboard && (
        <View style={styles.keyboardFooter}>
          <PianoKeyboard onKeyPress={handleKeyPress} />
        </View>
      )}

      {/* Fixed Stop footer — outside the ScrollView so it stays in view no
          matter how far the sheet has scrolled. Sits above the on-screen
          keyboard when both are present. */}
      {phase === 'playing' && (
        <View style={styles.stopFooter}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopExercise}>
            <Text style={styles.startBtnTxt}>{t.stop}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Brief "Start playing" cue — free tempo has no count-in, so this just
          confirms listening has begun. Fades away on its own after ~1s. */}
      {showStartHint && (
        <View style={styles.startHintOverlay} pointerEvents="none">
          <View style={styles.startHintPill}>
            <Text style={styles.startHintTxt}>{t.startPlayingHint}</Text>
          </View>
        </View>
      )}
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
    scroll: { flex: 1 },
    container: { padding: 16, paddingBottom: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    back: { fontSize: 16, color: C.primary, fontWeight: '600' },
    levelLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
    controls: { marginBottom: 16 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.card },
    scoreCount: { fontSize: 22, fontWeight: '800' },
    scoreLbl: { fontSize: 12, color: C.muted, fontWeight: '600' },
    progress: { textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 10 },
    listening: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 4 },
    keyboardFooter: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
    stopFooter: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
    btnArea: { marginTop: 24, gap: 10 },
    startBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    startBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
    newBtn: { backgroundColor: C.card, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    newBtnTxt: { color: C.text, fontSize: 15, fontWeight: '600' },
    stopBtn: { backgroundColor: '#ef4444', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    keyLabel: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 12 },

    startHintOverlay: {
      ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    startHintPill: {
      backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
    },
    startHintTxt: { fontFamily: 'Heebo_800ExtraBold', color: '#fff', fontSize: 20 },
  });
}
