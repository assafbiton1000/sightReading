import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, ScrollView, Alert,
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
import { timbreSettings } from '../utils/timbreSettings';
import SheetMusic, { NotePosition } from '../components/SheetMusic';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';
import { useLang } from '../context/LangContext';

type Route = RouteProp<RootStackParamList, 'Practice'>;
type Nav = StackNavigationProp<RootStackParamList, 'Practice'>;
type NoteResult = 'correct' | 'wrong' | 'pending';
type Phase = 'idle' | 'countdown' | 'playing' | 'done';

function buildSynthHtml(brightness: number, sustain: number) {
  return `<!DOCTYPE html><html><body><script>
var _ctx=null,BR=${brightness},SU=${sustain};
function _play(freq,dur){
  if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();
  var t=_ctx.currentTime,tc=Math.max(dur*0.3,SU);
  var o1=_ctx.createOscillator(),g1=_ctx.createGain();
  o1.type='sine';o1.frequency.value=freq;
  g1.gain.setValueAtTime(0,t);g1.gain.linearRampToValueAtTime(0.68,t+0.007);
  g1.gain.setTargetAtTime(0,t+0.007,tc);
  o1.connect(g1);g1.connect(_ctx.destination);o1.start(t);o1.stop(t+tc*6+0.1);
  var o2=_ctx.createOscillator(),g2=_ctx.createGain();
  o2.type='sine';o2.frequency.value=freq*2;
  g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(BR*0.8,t+0.004);
  g2.gain.setTargetAtTime(0,t+0.004,0.06);
  o2.connect(g2);g2.connect(_ctx.destination);o2.start(t);o2.stop(t+0.5);
  var o3=_ctx.createOscillator(),g3=_ctx.createGain();
  o3.type='sine';o3.frequency.value=freq*3;
  g3.gain.setValueAtTime(0,t);g3.gain.linearRampToValueAtTime(BR*0.35,t+0.003);
  g3.gain.setTargetAtTime(0,t+0.003,0.025);
  o3.connect(g3);g3.connect(_ctx.destination);o3.start(t);o3.stop(t+0.2);
  var o4=_ctx.createOscillator(),g4=_ctx.createGain();
  o4.type='sine';o4.frequency.value=freq*4;
  g4.gain.setValueAtTime(0,t);g4.gain.linearRampToValueAtTime(BR*0.15,t+0.002);
  g4.gain.setTargetAtTime(0,t+0.002,0.012);
  o4.connect(g4);g4.connect(_ctx.destination);o4.start(t);o4.stop(t+0.12);
  try{var sr=_ctx.sampleRate,len=Math.floor(sr*0.005),b=_ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  var s=_ctx.createBufferSource(),gn=_ctx.createGain();
  gn.gain.value=0.035;s.buffer=b;s.connect(gn);gn.connect(_ctx.destination);s.start(t);}catch(e){}
}
function onMsg(e){try{var m=JSON.parse(e.data);if(m.cmd==='play')_play(m.freq,m.dur);}catch(_){}}
document.addEventListener('message',onMsg);window.addEventListener('message',onMsg);
</script></body></html>`;
}

export default function PracticeScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';
  const { t } = useLang();

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

  // ── Cursor refs ────────────────────────────────────────────────────
  const notePositionsRef = useRef<NotePosition[]>([]);
  const cursorLineIdxRef = useRef(0);
  const cursorXAnim = useRef(new Animated.Value(-100)).current;
  const cursorSequenceRef = useRef<Animated.CompositeAnimation | null>(null);
  const [cursorLineIdx, setCursorLineIdx] = useState(0);
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
    cursorXAnim.stopAnimation();
    cursorXAnim.setValue(-100);
    setCursorLineIdx(0);
    cursorLineIdxRef.current = 0;
    notePositionsRef.current = [];
  }

  useEffect(() => { generateNewExercise(); }, []);

  // ── Synth: play a note by frequency ────────────────────────────────
  function playSound(freq: number) {
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur: 0.5 }))}}));true;`
    );
  }

  // ── Cursor: store VexFlow positions after SheetMusic renders ───────
  const handleNotePositions = useCallback((positions: NotePosition[]) => {
    notePositionsRef.current = positions;
  }, []);

  // ── Cursor: slide TO the note when it plays, wait there until next note ──
  const activateNote = useCallback((idx: number) => {
    const ns = notesRef.current;

    // Play guide sound immediately
    [idx, isSimultaneous ? idx + 1 : -1].forEach(i => {
      if (i >= 0 && i < ns.length) ns[i].keys.forEach(k => playSound(noteToFreq(k)));
    });

    const moveCursor = () => {
      const pos = notePositionsRef.current.find(p => p.idx === idx);
      if (!pos) return;

      if (pos.lineIdx !== cursorLineIdxRef.current) {
        cursorLineIdxRef.current = pos.lineIdx;
        setCursorLineIdx(pos.lineIdx);
      }

      cursorSequenceRef.current?.stop();
      cursorXAnim.stopAnimation();
      if (idx === 0) {
        cursorXAnim.setValue(pos.x);
      } else {
        Animated.timing(cursorXAnim, {
          toValue: pos.x,
          duration: 80,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start();
      }
    };

    // idx=0: cursor not visible yet (countdown), snap immediately — no delay needed
    // idx>0: delay 80ms so WebView note-highlight renders before cursor arrives
    if (idx === 0) {
      moveCursor();
    } else {
      setTimeout(moveCursor, 80);
    }
  }, [isSimultaneous]); // eslint-disable-line react-hooks/exhaustive-deps

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
        cursorXAnim.stopAnimation();
        const correct = results.filter(r => r === 'correct').length;
        setTimeout(() => navigation.navigate('Result', { correct, total: ns.length, levelId, clef, noteCount, bothMode }), 800);
      } else {
        setCurrentNoteIdx(nextIdx);
        currentIdxRef.current = nextIdx;
        noteStartBeatRef.current = beatCountRef.current;
        activateNote(nextIdx);
      }
    }
    beatCountRef.current += 1;
  }, [isSimultaneous, activateNote]);

  const { start: startMetronome, stop: stopMetronome } = useMetronome(level.bpm, handleTick, metronomeMuted);

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
    cursorXAnim.stopAnimation();
    cursorXAnim.setValue(-100);
    setCursorLineIdx(0);
    cursorLineIdxRef.current = 0;
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
  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');
  const CURSOR_SYS_H = isGrand ? 200 : 120;
  const CURSOR_H = isGrand ? 155 : 90;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hidden: pitch detector */}
      <PitchDetectorView ref={pitchRef} onPitchDetected={handlePitch} />
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
          <Text style={styles.levelLabel}>{t.levelLabel} {levelId} · {level.nameHe}</Text>
        </View>

        {/* Score row */}
        <View style={styles.scoreRow}>
          <ScoreChip label={t.correctLabel} count={correctCount} color="#22c55e" />
          <Animated.View style={[styles.beatDot, {
            transform: [{ scale: pulseAnim }],
            backgroundColor: beatIndicator ? '#4F6EF7' : '#C4CAE0',
          }]} />
          <TouchableOpacity onPress={() => setMetronomeMuted(m => !m)} style={styles.muteBtn}>
            <Text style={styles.muteBtnTxt}>{metronomeMuted ? '🔕' : '🔔'}</Text>
          </TouchableOpacity>
          <ScoreChip label={t.wrongLabel} count={wrongCount} color="#ef4444" />
        </View>

        {/* Sheet music + cursor overlay */}
        {notes.length > 0 && (
          <View style={{ position: 'relative' }}>
            <SheetMusic
              notes={notes}
              highlightedIndices={getHighlighted(currentNoteIdx)}
              noteResults={noteResults}
              keySignature={keySignature}
              timeSignature={[4, 4]}
              onNotePositions={handleNotePositions}
            />
            {phase === 'playing' && (
              <Animated.View
                pointerEvents="none"
                style={[styles.cursor, {
                  top: cursorLineIdx * CURSOR_SYS_H + 15,
                  height: CURSOR_H,
                  transform: [{ translateX: cursorXAnim }],
                }]}
              />
            )}
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

        <Text style={styles.bpmLabel}>{level.bpm} BPM · {keySignature}</Text>
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
  muteBtn: { padding: 4 },
  muteBtnTxt: { fontSize: 18 },
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
  cursor: { position: 'absolute', width: 2.5, backgroundColor: '#4F6EF7', opacity: 0.7, borderRadius: 2 },
});
