import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, ScrollView, Alert,
} from 'react-native';
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
import SheetMusic from '../components/SheetMusic';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';

type Route = RouteProp<RootStackParamList, 'Practice'>;
type Nav = StackNavigationProp<RootStackParamList, 'Practice'>;
type NoteResult = 'correct' | 'wrong' | 'pending';
type Phase = 'idle' | 'countdown' | 'playing' | 'done';

// Piano pop synth: clean fundamental + brief brightness + hammer click
const SYNTH_HTML = `<!DOCTYPE html><html><body><script>
var _ctx=null;
function _play(freq,dur){
  if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();
  var t=_ctx.currentTime;
  var tc=Math.max(dur*0.28,0.08);
  // Fundamental: strong sine, exponential decay via setTargetAtTime
  var o1=_ctx.createOscillator(),g1=_ctx.createGain();
  o1.type='sine';o1.frequency.value=freq;
  g1.gain.setValueAtTime(0,t);
  g1.gain.linearRampToValueAtTime(0.82,t+0.003);
  g1.gain.setTargetAtTime(0,t+0.003,tc);
  o1.connect(g1);g1.connect(_ctx.destination);
  o1.start(t);o1.stop(t+tc*5+0.05);
  // Octave overtone: brief brightness, decays in ~20ms
  var o2=_ctx.createOscillator(),g2=_ctx.createGain();
  o2.type='sine';o2.frequency.value=freq*2;
  g2.gain.setValueAtTime(0,t);
  g2.gain.linearRampToValueAtTime(0.16,t+0.002);
  g2.gain.setTargetAtTime(0,t+0.002,0.018);
  o2.connect(g2);g2.connect(_ctx.destination);
  o2.start(t);o2.stop(t+0.18);
  // Hammer click: 7ms noise burst
  try{
    var sr=_ctx.sampleRate,len=Math.floor(sr*0.007);
    var b=_ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
    for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    var s=_ctx.createBufferSource(),gn=_ctx.createGain();
    gn.gain.value=0.09;s.buffer=b;s.connect(gn);gn.connect(_ctx.destination);s.start(t);
  }catch(e){}
}
function onMsg(e){try{var m=JSON.parse(e.data);if(m.cmd==='play')_play(m.freq,m.dur);}catch(_){}}
document.addEventListener('message',onMsg);
window.addEventListener('message',onMsg);
</script></body></html>`;

export default function PracticeScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';

  // ── State ──────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [keySignature, setKeySignature] = useState('C');
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);
  const [noteResults, setNoteResults] = useState<NoteResult[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [beatIndicator, setBeatIndicator] = useState(false);

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

  // ── Generate exercise ONCE on mount ────────────────────────────────
  function generateNewExercise() {
    const generated = generateExercise(level, clef, noteCount, bothMode);
    const keySig = getRandomKeySignature(level.maxSharpsFlats);
    const pending: NoteResult[] = generated.map(() => 'pending');
    setNotes(generated);
    notesRef.current = generated;
    setKeySignature(keySig);
    setNoteResults(pending);
    resultsRef.current = pending;
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
  }

  useEffect(() => { generateNewExercise(); }, []);

  // ── Synth: play a note by frequency ────────────────────────────────
  function playSound(freq: number) {
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur: 0.4 }))}}));true;`
    );
  }

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
        beatCountRef.current = 0;
        noteStartBeatRef.current = 0;
        const startIdx = 0;
        setCurrentNoteIdx(startIdx);
        currentIdxRef.current = startIdx;
        pitchRef.current?.start();
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
        pitchRef.current?.stop();
        setCurrentNoteIdx(-1);
        const correct = results.filter(r => r === 'correct').length;
        setTimeout(() => navigation.navigate('Result', { correct, total: ns.length, levelId, clef, noteCount, bothMode }), 800);
      } else {
        setCurrentNoteIdx(nextIdx);
        currentIdxRef.current = nextIdx;
        noteStartBeatRef.current = beatCountRef.current;
      }
    }
    beatCountRef.current += 1;
  }, [isSimultaneous]);

  const { start: startMetronome, stop: stopMetronome } = useMetronome(level.bpm, handleTick);

  // ── Start: resets results but KEEPS same notes ─────────────────────
  function handleStart() {
    if (phase === 'playing' || phase === 'countdown') return;
    const pending: NoteResult[] = notesRef.current.map(() => 'pending');
    setNoteResults(pending);
    resultsRef.current = pending;
    setCurrentNoteIdx(-1);
    currentIdxRef.current = -1;
    beatCountRef.current = 0;
    noteStartBeatRef.current = 0;
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
  }

  // ── Pitch detection ────────────────────────────────────────────────
  const handlePitch = useCallback((freq: number) => {
    if (phaseRef.current !== 'playing') return;
    const idx = currentIdxRef.current;
    const ns = notesRef.current;
    if (idx < 0 || idx >= ns.length) return;

    const step = isSimultaneous ? 2 : 1;
    const toCheck = isSimultaneous ? [idx, idx + 1] : [idx];

    toCheck.forEach(i => {
      if (i >= ns.length) return;
      if (resultsRef.current[i] !== 'pending') return;
      const matched = ns[i].keys.some(k => isNoteMatch(freq, k));
      if (matched) {
        const results = [...resultsRef.current];
        results[i] = 'correct';
        resultsRef.current = results;
        setNoteResults([...results]);
        // Play sound of the detected note
        playSound(noteToFreq(ns[i].keys[0]));
      }
    });

    // In simultaneous mode: if BOTH in pair are correct, advance
    if (isSimultaneous) {
      const i0 = currentIdxRef.current;
      const i1 = i0 + 1;
      if (
        i0 < ns.length && i1 < ns.length &&
        resultsRef.current[i0] === 'correct' &&
        resultsRef.current[i1] === 'correct'
      ) {
        const nextIdx = i0 + step;
        if (nextIdx >= ns.length) {
          phaseRef.current = 'done';
          setPhase('done');
          pitchRef.current?.stop();
          setCurrentNoteIdx(-1);
        } else {
          setCurrentNoteIdx(nextIdx);
          currentIdxRef.current = nextIdx;
          noteStartBeatRef.current = beatCountRef.current;
        }
      }
    } else {
      // Sequential: advance when this note is correct
      if (resultsRef.current[idx] === 'correct') {
        const nextIdx = idx + 1;
        if (nextIdx >= ns.length) {
          phaseRef.current = 'done';
          setPhase('done');
          pitchRef.current?.stop();
          setCurrentNoteIdx(-1);
        } else {
          setCurrentNoteIdx(nextIdx);
          currentIdxRef.current = nextIdx;
          noteStartBeatRef.current = beatCountRef.current;
        }
      }
    }
  }, [isSimultaneous]);

  const correctCount = noteResults.filter(r => r === 'correct').length;
  const wrongCount = noteResults.filter(r => r === 'wrong').length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hidden: pitch detector */}
      <PitchDetectorView ref={pitchRef} onPitchDetected={handlePitch} />
      {/* Hidden: synth for note sound feedback */}
      <View style={styles.hidden}>
        <WebView ref={synthRef} source={{ html: SYNTH_HTML }} javaScriptEnabled originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { handleStop(); navigation.goBack(); }}>
            <Text style={styles.back}>← חזרה</Text>
          </TouchableOpacity>
          <Text style={styles.levelLabel}>רמה {levelId} · {level.nameHe}</Text>
        </View>

        {/* Score row */}
        <View style={styles.scoreRow}>
          <ScoreChip label="נכון" count={correctCount} color="#22c55e" />
          <Animated.View style={[styles.beatDot, {
            transform: [{ scale: pulseAnim }],
            backgroundColor: beatIndicator ? '#4F6EF7' : '#C4CAE0',
          }]} />
          <ScoreChip label="שגוי" count={wrongCount} color="#ef4444" />
        </View>

        {/* Sheet music */}
        {notes.length > 0 && (
          <SheetMusic
            notes={notes}
            highlightedIndices={getHighlighted(currentNoteIdx)}
            noteResults={noteResults}
            keySignature={keySignature}
            timeSignature={[4, 4]}
          />
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
            תו {Math.floor(currentNoteIdx / (isSimultaneous ? 2 : 1)) + 1} / {notes.length / (isSimultaneous ? 2 : 1)}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.btnArea}>
          {(phase === 'idle' || phase === 'done') && (
            <>
              <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                <Text style={styles.startBtnTxt}>{phase === 'done' ? 'נסה שוב' : 'התחל'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newBtn} onPress={generateNewExercise}>
                <Text style={styles.newBtnTxt}>תרגיל חדש</Text>
              </TouchableOpacity>
            </>
          )}
          {(phase === 'playing' || phase === 'countdown') && (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.startBtnTxt}>עצור</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.bpmLabel}>{level.bpm} BPM · {keySignature} major</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.scoreChip, { borderColor: color }]}>
      <Text style={[styles.scoreCount, { color }]}>{count}</Text>
      <Text style={styles.scoreLbl}>{label}</Text>
    </View>
  );
}

const C = { bg: '#F5F7FA', card: '#fff', primary: '#4F6EF7', text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0' };

const styles = StyleSheet.create({
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
  countdownBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.88)', zIndex: 10 },
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
