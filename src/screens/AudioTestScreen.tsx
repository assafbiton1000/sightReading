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

  const [currentKey, setCurrentKey] = useState('g/4');
  const [detected, setDetected] = useState(false);
  const [count, setCount] = useState(0);
  const [lastFreq, setLastFreq] = useState<number | null>(null);
  const [micStatus, setMicStatus] = useState<'waiting' | 'ok' | 'error'>('waiting');
  const [micError, setMicError] = useState('');

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

  const disp = NOTE_DISPLAY[currentKey] ?? { name: '?', octave: '' };
  const solfege = NOTE_SOLFEGE[currentKey] ?? currentKey;

  const sheetNote: GeneratedNote = { keys: [currentKey], duration: 'w', clef: 'treble' };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => { pitchRef.current?.stop(); navigation.goBack(); }}>
            <Text style={s.back}>← חזרה</Text>
          </TouchableOpacity>
          <Text style={s.title}>בדיקת שמע</Text>
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
            <Text style={s.counterLbl}>תווים זוהו</Text>
          </View>
          <View style={[s.badge, detected ? s.badgeGreen : s.badgeBlue]}>
            <Text style={s.badgeTxt}>
              {detected ? '✓ נכון!' : micStatus === 'ok' ? '🎤 מאזין...' : '🎤 מחכה...'}
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
        <Text style={s.hint}>נגן את התו הכחול על הפסנתר. כשתנגן נכון הוא יתחלף לתו חדש.</Text>

        {/* Frequency / mic feedback */}
        <View style={s.debugBox}>
          <Text style={s.debugTitle}>אות מיקרופון</Text>

          {micStatus === 'error' ? (
            <Text style={s.errTxt}>{micError || 'שגיאת מיקרופון'}</Text>
          ) : lastFreq ? (
            <Text style={s.freqTxt}>{lastFreq} Hz — מיקרופון פעיל</Text>
          ) : (
            <Text style={s.mutedTxt}>ממתין לצליל...</Text>
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
});
