import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import PitchDetectorView, { PitchDetectorHandle } from '../components/PitchDetectorView';
import SheetMusic from '../components/SheetMusic';
import { isNoteMatch } from '../utils/musicTheory';
import { GeneratedNote } from '../utils/noteGenerator';
import { timbreSettings } from '../utils/timbreSettings';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLang } from '../context/LangContext';

// Calibration WebView: listens 2.5s, measures harmonic brightness + sustain via FFT
const CAL_HTML = `<!DOCTYPE html><html><body><script>
if(!navigator.mediaDevices)navigator.mediaDevices={};
if(!navigator.mediaDevices.getUserMedia){
  var _g=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;
  navigator.mediaDevices.getUserMedia=_g?function(c){return new Promise(function(r,j){_g.call(navigator,c,r,j);})}:function(){return Promise.reject(new Error('no mic'));};
}
function calibrate(){
  navigator.mediaDevices.getUserMedia({audio:true,video:false})
  .then(function(stream){
    var ctx=new(window.AudioContext||window.webkitAudioContext)();
    var src=ctx.createMediaStreamSource(stream);
    var an=ctx.createAnalyser();an.fftSize=4096;src.connect(an);
    var buf=new Float32Array(an.frequencyBinCount);
    var brightSamples=[],rmsSamples=[];
    var sr=ctx.sampleRate;var binHz=sr/an.fftSize;
    var start=Date.now();
    function tick(){
      an.getFloatFrequencyData(buf);
      var peakBin=0,peakDb=-Infinity;
      for(var i=Math.floor(60/binHz);i<Math.floor(2000/binHz);i++){if(buf[i]>peakDb){peakDb=buf[i];peakBin=i;}}
      if(peakDb>-55&&peakBin>0){
        var f1=Math.pow(10,peakDb/20);
        var h2bin=peakBin*2;
        var h2db=h2bin<buf.length?buf[h2bin]:-80;
        var f2=Math.pow(10,h2db/20);
        brightSamples.push(Math.max(0.04,Math.min(0.40,f2/f1)));
        rmsSamples.push(f1);
      }
      if(Date.now()-start<2500){setTimeout(tick,120);}
      else{
        stream.getTracks().forEach(function(t){t.stop();});ctx.close();
        var b=brightSamples.length>0?brightSamples.reduce(function(a,c){return a+c;},0)/brightSamples.length:0.16;
        var s=Math.max(0.06,Math.min(0.36,0.30-(b-0.05)*0.8));
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'timbre',brightness:parseFloat(b.toFixed(3)),sustain:parseFloat(s.toFixed(3))}));
      }
    }
    setTimeout(tick,300);
  })
  .catch(function(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'timbreErr',msg:e.message}));});
}
function onCmd(e){try{var m=JSON.parse(e.data);if(m.cmd==='calibrate')calibrate();}catch(_){}}
document.addEventListener('message',onCmd);window.addEventListener('message',onCmd);
</script></body></html>`;

// C4–C5 range, easy to test on piano
const TEST_KEYS = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'];

const NOTE_DISPLAY: Record<string, { name: string; octave: string }> = {
  'c/4': { name: 'C', octave: '4' },
  'd/4': { name: 'D', octave: '4' },
  'e/4': { name: 'E', octave: '4' },
  'f/4': { name: 'F', octave: '4' },
  'g/4': { name: 'G', octave: '4' },
  'a/4': { name: 'A', octave: '4' },
  'b/4': { name: 'B', octave: '4' },
  'c/5': { name: 'C', octave: '5' },
};

// Hebrew note names so user understands what to play
const NOTE_SOLFEGE: Record<string, string> = {
  'c/4': 'דו', 'd/4': 'רה', 'e/4': 'מי', 'f/4': 'פה',
  'g/4': 'סול', 'a/4': 'לה', 'b/4': 'סי', 'c/5': 'דו (גבוה)',
};

function pickOther(avoid: string): string {
  const opts = TEST_KEYS.filter(k => k !== avoid);
  return opts[Math.floor(Math.random() * opts.length)];
}

export default function AudioTestScreen() {
  const navigation = useNavigation();
  const pitchRef = useRef<PitchDetectorHandle>(null);
  const { t } = useLang();

  const [currentKey, setCurrentKey] = useState('g/4');
  const [detected, setDetected] = useState(false);
  const [count, setCount] = useState(0);
  const [lastFreq, setLastFreq] = useState<number | null>(null);
  const [micStatus, setMicStatus] = useState<'waiting' | 'ok' | 'error'>('waiting');
  const [micError, setMicError] = useState('');
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const calRef = useRef<WebView>(null);

  const detectedRef = useRef(false);
  const currentKeyRef = useRef('g/4');

  const flashAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    Audio.requestPermissionsAsync()
      .then(({ granted }) => {
        if (cancelled) return;
        if (!granted) {
          setMicError('אין הרשאת מיקרופון — אשר בהגדרות הטלפון');
          setMicStatus('error');
          return;
        }
        setTimeout(() => {
          if (!cancelled) pitchRef.current?.start();
        }, 1000);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setMicError(String(err));
          setMicStatus('error');
        }
      });
    return () => {
      cancelled = true;
      pitchRef.current?.stop();
    };
  }, []);

  const handlePitch = useCallback((freq: number) => {
    setLastFreq(Math.round(freq));
    setMicStatus('ok');

    if (detectedRef.current) return;

    if (isNoteMatch(freq, currentKeyRef.current)) {
      detectedRef.current = true;
      setDetected(true);
      setCount(c => c + 1);

      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1.12, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        const next = pickOther(currentKeyRef.current);
        currentKeyRef.current = next;
        setCurrentKey(next);
        detectedRef.current = false;
        setDetected(false);
      }, 650);
    }
  }, []);

  function startCalibration() {
    setCalibrating(true);
    setCalibrated(false);
    calRef.current?.injectJavaScript(
      `window.dispatchEvent(new MessageEvent('message',{data:'{"cmd":"calibrate"}'})); true;`
    );
    // Timeout fallback
    setTimeout(() => setCalibrating(false), 4000);
  }

  function handleCalMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'timbre') {
        timbreSettings.set({ brightness: msg.brightness, sustain: msg.sustain });
        setCalibrating(false);
        setCalibrated(true);
      } else if (msg.type === 'timbreErr') {
        setCalibrating(false);
      }
    } catch (_) {}
  }

  const disp = NOTE_DISPLAY[currentKey] ?? { name: '?', octave: '' };
  const solfege = NOTE_SOLFEGE[currentKey] ?? currentKey;

  const sheetNote: GeneratedNote = { keys: [currentKey], duration: 'w', clef: 'treble' };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => { pitchRef.current?.stop(); navigation.goBack(); }}>
            <Text style={s.back}>{t.back}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t.audioTestTitle}</Text>
        </View>

        {/* Hidden calibration WebView */}
        <View style={{ width: 1, height: 1, opacity: 0 }}>
          <WebView ref={calRef} source={{ html: CAL_HTML, baseUrl: 'http://localhost' }}
            javaScriptEnabled originWhitelist={['*']} onMessage={handleCalMessage}
            allowUniversalAccessFromFileURLs mediaPlaybackRequiresUserAction={false}
            {...({ onPermissionRequest: (r: any) => r.grant(r.resources) } as any)} />
        </View>

        {/* Hidden pitch detector */}
        <PitchDetectorView
          ref={pitchRef}
          onPitchDetected={handlePitch}
          onError={msg => { setMicError(msg); setMicStatus('error'); }}
        />

        {/* Counter + status */}
        <View style={s.topRow}>
          <View style={s.counterBox}>
            <Text style={s.counterNum}>{count}</Text>
            <Text style={s.counterLbl}>{t.notesDetected}</Text>
          </View>
          <View style={[s.badge, detected ? s.badgeGreen : s.badgeBlue]}>
            <Text style={s.badgeTxt}>
              {detected ? t.correctExclaim : micStatus === 'ok' ? t.listeningLabel : t.waitingLabel}
            </Text>
          </View>
        </View>

        {/* Sheet music — shows the note on the staff */}
        <Animated.View style={{ transform: [{ scale: flashAnim }] }}>
          <SheetMusic
            notes={[sheetNote]}
            highlightedIndices={detected ? [] : [0]}
            noteResults={[detected ? 'correct' : 'pending']}
            keySignature="C"
            timeSignature={[4, 4]}
          />
        </Animated.View>

        {/* Note name label below staff */}
        <View style={[s.noteLabel, detected && s.noteLabelGreen]}>
          <Text style={[s.noteLetter, detected && { color: '#22c55e' }]}>{disp.name}{disp.octave}</Text>
          <Text style={s.noteSolfege}>{solfege}</Text>
        </View>

        {/* Instruction */}
        <Text style={s.hint}>{t.playNoteHint}</Text>

        {/* Frequency / mic feedback */}
        {/* Timbre calibration */}
        <TouchableOpacity style={[s.calBtn, calibrating && s.calBtnActive]} onPress={startCalibration} disabled={calibrating}>
          <Text style={s.calBtnTxt}>
            {calibrating ? t.calibratingLabel : calibrated ? t.calibratedLabel : t.calibrateBtn}
          </Text>
        </TouchableOpacity>
        {calibrating && <Text style={s.calHint}>{t.calibrateHint}</Text>}

        <View style={s.debugBox}>
          <Text style={s.debugTitle}>{t.micSignal}</Text>

          {micStatus === 'error' ? (
            <Text style={s.errTxt}>{micError || t.micErrorLabel}</Text>
          ) : lastFreq ? (
            <Text style={s.freqTxt}>{lastFreq} Hz — {t.micActiveLabel}</Text>
          ) : (
            <Text style={s.mutedTxt}>{t.waitingSound}</Text>
          )}

          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                { width: `${lastFreq ? Math.min(100, (lastFreq / 1200) * 100) : 0}%` as any },
                detected && { backgroundColor: '#22c55e' },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = {
  bg: '#F5F7FA', card: '#fff', primary: '#4F6EF7', green: '#22c55e',
  text: '#1A1D2E', muted: '#8A8FA8', border: '#E4E7F0',
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  back: { fontSize: 16, color: C.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: C.text },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  counterBox: { alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10, borderWidth: 1.5, borderColor: C.border },
  counterNum: { fontSize: 38, fontWeight: '900', color: C.primary },
  counterLbl: { fontSize: 11, color: C.muted, fontWeight: '600' },
  badge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  badgeBlue: { backgroundColor: '#EEF2FF' },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeTxt: { fontSize: 15, fontWeight: '700', color: C.text },

  noteLabel: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    gap: 10, paddingVertical: 10, marginBottom: 4,
  },
  noteLabelGreen: {},
  noteLetter: { fontSize: 36, fontWeight: '900', color: C.primary },
  noteSolfege: { fontSize: 20, color: C.muted, fontWeight: '600' },

  hint: { textAlign: 'center', color: C.muted, fontSize: 13, marginBottom: 24 },

  debugBox: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  debugTitle: { fontSize: 11, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  freqTxt: { fontSize: 14, color: C.text, fontWeight: '600' },
  mutedTxt: { fontSize: 13, color: C.muted },
  errTxt: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  barTrack: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginTop: 10 },
  barFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  calBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: C.primary, marginBottom: 10 },
  calBtnActive: { backgroundColor: '#E0E7FF' },
  calBtnTxt: { fontSize: 14, fontWeight: '700', color: C.primary },
  calHint: { textAlign: 'center', color: C.muted, fontSize: 12, marginBottom: 10 },
});
