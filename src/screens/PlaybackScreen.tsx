import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { LEVELS } from '../constants/levels';
import { generateExercise, getRandomKeySignature, GeneratedNote } from '../utils/noteGenerator';
import { noteToFreq } from '../utils/musicTheory';
import { DURATION_BEATS } from '../constants/notes';
import SheetMusic from '../components/SheetMusic';

type Route = RouteProp<RootStackParamList, 'Playback'>;
type Nav = StackNavigationProp<RootStackParamList, 'Playback'>;

// Piano pop synth: clean fundamental + brief brightness + hammer click
const SYNTH_HTML = `<!DOCTYPE html><html><body><script>
var _ctx=null;
function _play(freq,dur){
  if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();
  var t=_ctx.currentTime;
  var tc=Math.max(dur*0.28,0.08);
  var o1=_ctx.createOscillator(),g1=_ctx.createGain();
  o1.type='sine';o1.frequency.value=freq;
  g1.gain.setValueAtTime(0,t);
  g1.gain.linearRampToValueAtTime(0.82,t+0.003);
  g1.gain.setTargetAtTime(0,t+0.003,tc);
  o1.connect(g1);g1.connect(_ctx.destination);
  o1.start(t);o1.stop(t+tc*5+0.05);
  var o2=_ctx.createOscillator(),g2=_ctx.createGain();
  o2.type='sine';o2.frequency.value=freq*2;
  g2.gain.setValueAtTime(0,t);
  g2.gain.linearRampToValueAtTime(0.16,t+0.002);
  g2.gain.setTargetAtTime(0,t+0.002,0.018);
  o2.connect(g2);g2.connect(_ctx.destination);
  o2.start(t);o2.stop(t+0.18);
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

export default function PlaybackScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { levelId, clef, noteCount, bothMode } = route.params;
  const level = LEVELS.find(l => l.id === levelId)!;
  const isSimultaneous = clef === 'both' && bothMode === 'simultaneous';

  const [notes, setNotes] = useState<GeneratedNote[]>([]);
  const [keySignature, setKeySignature] = useState('C');
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  function generate() {
    const generated = generateExercise(level, clef, noteCount, bothMode);
    const keySig = getRandomKeySignature(level.maxSharpsFlats);
    setNotes(generated);
    setKeySignature(keySig);
    setHighlightedIndices([]);
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

  function playSequence(noteList: GeneratedNote[], idx: number) {
    if (idx >= noteList.length) { setIsPlaying(false); setHighlightedIndices([]); return; }

    const secPerBeat = 60 / level.bpm;

    if (isSimultaneous) {
      // Play pair: idx (treble) + idx+1 (bass) together
      const highlighted = [idx, idx + 1].filter(i => i < noteList.length);
      setHighlightedIndices(highlighted);
      pulse();

      const dur1 = (DURATION_BEATS[noteList[idx].duration] ?? 1) * secPerBeat;
      noteList[idx].keys.forEach(k => sendNote(noteToFreq(k), dur1 * 0.9));

      if (idx + 1 < noteList.length) {
        const dur2 = (DURATION_BEATS[noteList[idx + 1].duration] ?? 1) * secPerBeat;
        noteList[idx + 1].keys.forEach(k => sendNote(noteToFreq(k), dur2 * 0.9));
      }

      const step = 2;
      timeoutRef.current = setTimeout(() => playSequence(noteList, idx + step), dur1 * 1000);
    } else {
      // Sequential: one note at a time
      setHighlightedIndices([idx]);
      pulse();
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
      return;
    }
    setIsPlaying(true);
    playSequence(notes, 0);
  }

  const pending: ('correct' | 'wrong' | 'pending')[] = notes.map(() => 'pending');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hidden}>
        <WebView ref={synthRef} source={{ html: SYNTH_HTML }} javaScriptEnabled originWhitelist={['*']}
          mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); navigation.goBack(); }}>
            <Text style={styles.back}>← חזרה</Text>
          </TouchableOpacity>
          <Text style={styles.levelLabel}>האזנה · רמה {levelId}</Text>
        </View>

        {/* Play button ABOVE the sheet music so it's always visible */}
        <View style={styles.controls}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={[styles.playBtn, isPlaying && styles.stopBtn]} onPress={handlePlay}>
              <Text style={styles.playBtnTxt}>{isPlaying ? '⏹ עצור' : '▶ נגן'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.bpm}>{level.bpm} BPM · {keySignature}</Text>
        </View>

        {notes.length > 0 && (
          <SheetMusic
            notes={notes}
            highlightedIndices={highlightedIndices}
            noteResults={pending}
            keySignature={keySignature}
            timeSignature={[4, 4]}
          />
        )}

        <TouchableOpacity style={styles.newBtn} onPress={generate}>
          <Text style={styles.newBtnTxt}>תווים חדשים</Text>
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
});
