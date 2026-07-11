import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { generateExercise, getRandomKeySignature, GeneratedNote } from '../utils/noteGenerator';
import { noteToFreq } from '../utils/musicTheory';
import { DURATION_BEATS } from '../constants/notes';
import SheetMusic, { NotePosition } from '../components/SheetMusic';
import { timbreSettings } from '../utils/timbreSettings';
import { useLang } from '../context/LangContext';

type Route = RouteProp<RootStackParamList, 'Playback'>;
type Nav = StackNavigationProp<RootStackParamList, 'Playback'>;

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

export default function PlaybackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';
  const { t } = useLang();

  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [keySignature, setKeySignature] = useState('C');
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const synthHtml = useRef((() => { const t = timbreSettings.get(); return buildSynthHtml(t.brightness, t.sustain); })()).current;

  // Cursor
  const notePositionsRef = useRef<NotePosition[]>([]);
  const cursorLineIdxRef = useRef(0);
  const cursorXAnim = useRef(new Animated.Value(-100)).current;
  const cursorSequenceRef = useRef<Animated.CompositeAnimation | null>(null);
  const [cursorLineIdx, setCursorLineIdx] = useState(0);

  const handleNotePositions = useCallback((positions: NotePosition[]) => {
    notePositionsRef.current = positions;
  }, []);

  function generate() {
    const generated = generateExercise(level, clef, noteCount, bothMode);
    const keySig = getRandomKeySignature(level.maxSharpsFlats);
    setNotes(generated);
    setKeySignature(keySig);
    setHighlightedIndices([]);
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cursorXAnim.stopAnimation();
    cursorXAnim.setValue(-100);
    setCursorLineIdx(0);
    cursorLineIdxRef.current = 0;
    notePositionsRef.current = [];
  }

  useEffect(() => { generate(); }, []);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  function sendNote(freq: number, dur: number) {
    synthRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify({ cmd: 'play', freq, dur }))}}));true;`
    );
  }

  function pulse() {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function maybeCursorLine(noteIdx: number, _noteList: GeneratedNote[]) {
    const moveCursor = () => {
      const pos = notePositionsRef.current.find(p => p.idx === noteIdx);
      if (!pos) return;

      if (pos.lineIdx !== cursorLineIdxRef.current) {
        cursorLineIdxRef.current = pos.lineIdx;
        setCursorLineIdx(pos.lineIdx);
      }

      cursorSequenceRef.current?.stop();
      cursorXAnim.stopAnimation();
      if (noteIdx === 0) {
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

    // noteIdx=0: snap immediately (first note, no previous position to slide from)
    // noteIdx>0: delay 80ms so WebView note-highlight renders before cursor arrives
    if (noteIdx === 0) {
      moveCursor();
    } else {
      setTimeout(moveCursor, 80);
    }
  }

  function playSequence(noteList: GeneratedNote[], idx: number) {
    if (idx >= noteList.length) {
      setIsPlaying(false);
      setHighlightedIndices([]);
      cursorXAnim.stopAnimation();
      return;
    }

    const secPerBeat = 60 / level.bpm;

    if (isSimultaneous) {
      const highlighted = [idx, idx + 1].filter(i => i < noteList.length);
      setHighlightedIndices(highlighted);
      pulse();
      maybeCursorLine(idx, noteList);

      const dur1 = (DURATION_BEATS[noteList[idx].duration] ?? 1) * secPerBeat;
      noteList[idx].keys.forEach(k => sendNote(noteToFreq(k), dur1 * 0.9));
      if (idx + 1 < noteList.length) {
        const dur2 = (DURATION_BEATS[noteList[idx + 1].duration] ?? 1) * secPerBeat;
        noteList[idx + 1].keys.forEach(k => sendNote(noteToFreq(k), dur2 * 0.9));
      }
      timeoutRef.current = setTimeout(() => playSequence(noteList, idx + 2), dur1 * 1000);
    } else {
      setHighlightedIndices([idx]);
      pulse();
      maybeCursorLine(idx, noteList);

      const note = noteList[idx];
      const dur = (DURATION_BEATS[note.duration] ?? 1) * secPerBeat;
      note.keys.forEach(k => sendNote(noteToFreq(k), dur * 0.9));
      timeoutRef.current = setTimeout(() => playSequence(noteList, idx + 1), dur * 1000);
    }
  }

  function handlePlay() {
    if (isPlaying) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsPlaying(false);
      setHighlightedIndices([]);
      cursorXAnim.stopAnimation();
      cursorXAnim.setValue(-100);
      setCursorLineIdx(0);
      cursorLineIdxRef.current = 0;
      return;
    }
    setIsPlaying(true);
    playSequence(notes, 0);
  }

  const pending: ('correct' | 'wrong' | 'pending')[] = notes.map(() => 'pending');
  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');
  const CURSOR_SYS_H = isGrand ? 200 : 120;
  const CURSOR_H = isGrand ? 155 : 90;

  return (
    <SafeAreaView style={styles.safe}>
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
              onNotePositions={handleNotePositions}
            />
            {isPlaying && (
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

        <TouchableOpacity style={styles.newBtn} onPress={generate}>
          <Text style={styles.newBtnTxt}>{t.newNotes}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = { bg: '#F5F7FA', primary: '#10b981', text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0', card: '#fff' };

const styles = StyleSheet.create({
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
  cursor: { position: 'absolute', width: 2.5, backgroundColor: '#10b981', opacity: 0.75, borderRadius: 2 },
});
